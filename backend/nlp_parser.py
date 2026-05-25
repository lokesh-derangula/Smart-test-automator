import re
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np

class NLPParser:
    """
    Parser to tokenize, preprocess and extract structural elements from User Stories
    and Acceptance Criteria to generate Gherkin (BDD) and prepare Playwright POM components.
    """

    def __init__(self):
        # Dictionary mapping action keywords to automation steps
        self.action_keywords = {
            'click': 'click',
            'press': 'click',
            'tap': 'click',
            'enter': 'type',
            'type': 'type',
            'fill': 'type',
            'input': 'type',
            'select': 'select',
            'choose': 'select',
            'check': 'check',
            'uncheck': 'uncheck',
            'hover': 'hover',
            'wait': 'wait'
        }
        
        # Dictionary mapping assertion keywords to playwright expectations
        self.assertion_keywords = {
            'see': 'visible',
            'visible': 'visible',
            'redirect': 'url',
            'url': 'url',
            'contain': 'text',
            'text': 'text',
            'show': 'visible',
            'display': 'visible',
            'enable': 'enabled',
            'disable': 'disabled'
        }

    def clean_text(self, text: str) -> str:
        """Basic text cleaning and normalization."""
        if not text:
            return ""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def split_into_steps(self, text: str) -> List[str]:
        """Split text into raw statements based on common delimiters (newlines, bullets, periods)."""
        # Split by typical bullet symbols or line breaks
        lines = re.split(r'[\n\r•\-\*]+', text)
        steps = []
        for line in lines:
            cleaned = line.strip()
            # Remove leading numbers like "1.", "2."
            cleaned = re.sub(r'^\d+\.?\s*', '', cleaned)
            if cleaned:
                steps.append(cleaned)
        return steps

    def parse_user_story(self, story: str) -> Dict[str, str]:
        """
        Parses a standard Agile User Story:
        'As a [role] I want to [feature] So that [benefit]'
        """
        parsed = {"role": "", "feature": "", "benefit": ""}
        if not story:
            return parsed

        # Search patterns
        role_match = re.search(r'As\s+a[n]?\s+(.*?)(?=\s+I\s+want|\s+so\s+that|$)', story, re.IGNORECASE)
        feature_match = re.search(r'I\s+want\s+to\s+(.*?)(?=\s+so\s+that|$)', story, re.IGNORECASE)
        benefit_match = re.search(r'so\s+that\s+(.*)', story, re.IGNORECASE)

        if role_match:
            parsed["role"] = role_match.group(1).strip()
        if feature_match:
            parsed["feature"] = feature_match.group(1).strip()
        if benefit_match:
            parsed["benefit"] = benefit_match.group(1).strip()

        return parsed

    def to_gherkin(self, story: str, acceptance_criteria: str) -> str:
        """
        Translates User Story and Acceptance Criteria into Gherkin BDD format.
        """
        story_info = self.parse_user_story(story)
        feature_name = story_info["feature"] or "Generated Feature"
        role = story_info["role"] or "User"
        benefit = story_info["benefit"] or ""

        gherkin_lines = []
        gherkin_lines.append(f"Feature: {feature_name}")
        gherkin_lines.append(f"  As a {role}")
        if benefit:
            gherkin_lines.append(f"  So that {benefit}")
        gherkin_lines.append("")

        raw_steps = self.split_into_steps(acceptance_criteria)
        
        # Analyze and format steps as Scenario
        scenario_name = "Verify " + (story_info["feature"] or "Acceptance Criteria")
        gherkin_lines.append(f"  Scenario: {scenario_name}")

        current_keyword = "Given"
        
        for i, step in enumerate(raw_steps):
            # Clean up the step text
            step_clean = step.strip()
            
            # Check if step already starts with Gherkin keywords
            match = re.match(r'^(Given|When|Then|And|But)\s+(.*)', step_clean, re.IGNORECASE)
            if match:
                kw = match.group(1).capitalize()
                content = match.group(2)
                # Keep keyword flow clean
                gherkin_lines.append(f"    {kw} {content}")
                current_keyword = kw if kw in ["Given", "When", "Then"] else current_keyword
            else:
                # Infer keyword based on position and content
                inferred_kw = "When"
                if i == 0 or any(k in step_clean.lower() for k in ["on the", "navigates to", "opens", "start at"]):
                    inferred_kw = "Given"
                elif any(k in step_clean.lower() for k in ["should", "expect", "verify", "then", "must", "see"]):
                    inferred_kw = "Then"
                
                # If consecutive steps have the same inferred category, use "And"
                if i > 0 and inferred_kw == current_keyword:
                    prefix = "And"
                else:
                    prefix = inferred_kw
                    current_keyword = inferred_kw

                gherkin_lines.append(f"    {prefix} {step_clean}")

        return "\n".join(gherkin_lines)

    def extract_semantic_elements(self, gherkin_text: str) -> List[Dict[str, Any]]:
        """
        Tokenizes Gherkin text and performs syntactic extraction of variables:
        - Selector inferences
        - Input values
        - Action types
        - Expected outcomes
        """
        lines = gherkin_text.split('\n')
        parsed_steps = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            match = re.match(r'^(Given|When|Then|And|But)\s+(.*)', line, re.IGNORECASE)
            if not match:
                continue
                
            keyword = match.group(1)
            step_content = match.group(2)
            
            # Extract possible selector names and values
            selector, val, action_type, expectation = self._analyze_step_content(step_content, keyword)
            
            parsed_steps.append({
                "keyword": keyword,
                "step": step_content,
                "selector": selector,
                "selector_var": self._to_camel_case(selector or "element"),
                "value": val,
                "action": action_type,
                "expectation": expectation
            })
            
        return parsed_steps

    def _to_camel_case(self, text: str) -> str:
        """Converts strings to camelCase variables."""
        # Clean text
        text = re.sub(r'[^a-zA-Z0-9\s\-]', '', text)
        words = text.split()
        if not words:
            return ""
        return words[0].lower() + "".join(w.capitalize() for w in words[1:])

    def _analyze_step_content(self, step_content: str, keyword: str) -> Tuple[str, str, str, str]:
        """
        Heuristic NLP POS/Entity extraction to identify:
        - selector (e.g. "username input")
        - value (e.g. "testuser")
        - action (e.g. "type")
        - expectation (e.g. "redirected")
        """
        lower_content = step_content.lower()
        
        # Initialize outputs
        selector = ""
        val = ""
        action_type = "none"
        expectation = "none"
        
        # 1. Look for quoted values (e.g., enters "username" or redirects to "/dashboard")
        quotes = re.findall(r'["\'\`]([^"\'\`]+)["\'\`]', step_content)
        if quotes:
            val = quotes[0]
            
        # 2. Heuristics for selectors
        # Look for target objects: "button", "input", "field", "link", "page", "box", "header", "message"
        selector_match = re.search(r'(?:the|click|fill|enter|to|in)\s+["\'\`]?([a-zA-Z0-9\s\-]+?)(?:\s+field|\s+input|\s+button|\s+link|\s+page|\s+box|\s+header|\s+message|\s+dropdown|\s+checkbox|$)[\s\.]', step_content + ' ')
        if selector_match:
            selector = selector_match.group(1).strip()
        else:
            # Fallback extraction: nouns preceding action/assertion verbs
            words = lower_content.split()
            # simple filter
            nouns = [w for w in words if w not in ['the', 'a', 'an', 'to', 'is', 'on', 'and', 'should', 'be']]
            if nouns:
                selector = " ".join(nouns[:2])
                
        # 3. Action type matching
        for k, v in self.action_keywords.items():
            if k in lower_content:
                action_type = v
                break
                
        # 4. Expectation matching
        for k, v in self.assertion_keywords.items():
            if k in lower_content:
                expectation = v
                break
                
        # Default selectors for login examples if matches are too generic
        if "login button" in lower_content or "submit" in lower_content:
            selector = "login button"
            action_type = "click"
        elif "username" in lower_content:
            selector = "username field"
            action_type = "type"
            if not val:
                val = "testuser"
        elif "password" in lower_content:
            selector = "password field"
            action_type = "type"
            if not val:
                val = "password123"
        elif "dashboard" in lower_content:
            selector = "dashboard url"
            if keyword.lower() == "then":
                expectation = "url"
                val = "/dashboard"
        elif "login page" in lower_content or "home page" in lower_content:
            selector = "login page"
            action_type = "goto"
            if not val:
                val = "https://example.com/login"

        return selector, val, action_type, expectation

    def get_pipeline_data(self, story: str, criteria: str) -> Dict[str, Any]:
        """
        Creates a pandas DataFrame representing the data pipeline steps,
        demonstrating preprocessing, tokenization, and extraction, and returns it.
        """
        gherkin = self.to_gherkin(story, criteria)
        steps_data = self.extract_semantic_elements(gherkin)
        
        # Convert steps to DataFrame format for NLP pipeline representation
        df_list = []
        for idx, item in enumerate(steps_data):
            # Generate simulated tokens
            tokens = item["step"].split()
            pos_tags = []
            for t in tokens:
                # Mock part-of-speech tagger
                t_lower = t.lower()
                if t_lower in ['the', 'a', 'an']:
                    pos_tags.append((t, "DET"))
                elif t_lower in ['user', 'credentials', 'username', 'password', 'dashboard', 'page', 'button']:
                    pos_tags.append((t, "NOUN"))
                elif t_lower in ['is', 'enters', 'clicks', 'redirected', 'navigates', 'should']:
                    pos_tags.append((t, "VERB"))
                else:
                    pos_tags.append((t, "ADJ/ADV/PROPN"))
            
            df_list.append({
                "StepID": f"STEP_{idx+1:02d}",
                "Keyword": item["keyword"],
                "Text": item["step"],
                "Tokens": str(tokens),
                "POSTags": str(pos_tags),
                "InferredSelector": item["selector"],
                "Variable": item["selector_var"],
                "Action": item["action"],
                "Value": item["value"],
                "Expectation": item["expectation"]
            })
            
        df = pd.DataFrame(df_list)
        return {
            "gherkin": gherkin,
            "steps": steps_data,
            "pipeline_table": df.to_dict(orient="records")
        }
