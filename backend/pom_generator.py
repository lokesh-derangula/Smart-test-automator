import re
from typing import List, Dict, Any

class POMGenerator:
    """
    Generates TypeScript Playwright code using the Page Object Model (POM) pattern.
    Separates locator definition/actions (Page class) from execution/assertions (Spec file).
    """

    def generate_pom(self, feature_name: str, parsed_steps: List[Dict[str, Any]]) -> Dict[str, str]:
        """
        Generates two files:
        1. A Page Object Class file (e.g. `AuthPage.ts`)
        2. A Playwright spec test file (e.g. `auth.spec.ts`)
        """
        # Formulate page class name
        class_name = self._to_pascal_case(feature_name) + "Page"
        file_base = self._to_snake_case(feature_name)
        page_filename = f"{class_name}.ts"
        spec_filename = f"{file_base}.spec.ts"

        # Organize selectors and actions
        locators = {}
        actions = []
        assertions = []
        
        # Track duplicate variables
        seen_vars = set()
        
        # Analyze steps to create Page Object definitions
        for step in parsed_steps:
            var_name = step["selector_var"]
            raw_selector = step["selector"]
            action = step["action"]
            val = step["value"]
            expectation = step["expectation"]
            kw = step["keyword"].lower()
            
            # Map raw selector to a Playwright CSS selector
            css_selector = self._infer_css_selector(raw_selector)
            
            if var_name and css_selector and var_name not in seen_vars:
                # We skip page-level targets (like "login page") from elements locators list
                if "page" not in raw_selector.lower() or "button" in raw_selector.lower() or "input" in raw_selector.lower():
                    locators[var_name] = {
                        "css": css_selector,
                        "desc": raw_selector
                    }
                    seen_vars.add(var_name)
            
            # Formulate steps logic for spec file
            if action == "goto":
                url_val = val if val else "https://example.com/login"
                actions.append({
                    "type": "goto",
                    "code": f"await {class_name.lower()}.goto();",
                    "desc": step["step"]
                })
            elif action == "type":
                input_val = val if val else f"sample_{var_name}"
                actions.append({
                    "type": "type",
                    "code": f"await {class_name.lower()}.fill{self._to_pascal_case(var_name)}('{input_val}');",
                    "desc": step["step"]
                })
            elif action == "click":
                actions.append({
                    "type": "click",
                    "code": f"await {class_name.lower()}.click{self._to_pascal_case(var_name)}();",
                    "desc": step["step"]
                })
            elif expectation == "url":
                url_val = val if val else "/dashboard"
                assertions.append({
                    "type": "url",
                    "code": f"await expect(page).toHaveURL(/.*{url_val}/);",
                    "desc": step["step"]
                })
            elif expectation == "visible":
                assertions.append({
                    "type": "visible",
                    "code": f"await expect({class_name.lower()}.{var_name}).toBeVisible();",
                    "desc": step["step"]
                })
            elif expectation == "text":
                txt_val = val if val else "Welcome"
                assertions.append({
                    "type": "text",
                    "code": f"await expect({class_name.lower()}.{var_name}).toContainText('{txt_val}');",
                    "desc": step["step"]
                })

        # Generate Page class code
        page_code = self._build_page_class(class_name, locators, parsed_steps)
        
        # Generate Spec file code
        spec_code = self._build_spec_file(class_name, page_filename, actions, assertions, feature_name)

        return {
            "page_filename": page_filename,
            "page_code": page_code,
            "spec_filename": spec_filename,
            "spec_code": spec_code
        }

    def _to_pascal_case(self, text: str) -> str:
        text = re.sub(r'[^a-zA-Z0-9\s\-]', '', text)
        words = text.split()
        if not words:
            return "Test"
        return "".join(w.capitalize() for w in words)

    def _to_snake_case(self, text: str) -> str:
        text = re.sub(r'[^a-zA-Z0-9\s\-]', '', text)
        words = text.split()
        if not words:
            return "test"
        return "_".join(w.lower() for w in words)

    def _infer_css_selector(self, raw_name: str) -> str:
        """Heuristics to determine realistic CSS/XPath selectors from plain text descriptions."""
        name = raw_name.lower()
        if "username" in name:
            return "#username"
        elif "password" in name:
            return "#password"
        elif "email" in name:
            return "#email"
        elif "login" in name and "button" in name:
            return "#loginButton"
        elif "submit" in name:
            return "button[type='submit']"
        elif "submit" in name and "button" in name:
            return "#submitButton"
        elif "dashboard" in name and "url" in name:
            return "/dashboard"
        elif "welcome" in name:
            return ".welcome-message"
        elif "error" in name:
            return ".error-alert"
        elif "success" in name:
            return ".success-toast"
        elif "profile" in name:
            return "a[href='/profile']"
        elif "search" in name and "input" in name:
            return "input[type='search']"
        elif "search" in name and "button" in name:
            return "button.search-btn"
        else:
            # Fallback based on last word
            words = name.split()
            if not words:
                return "#element"
            last_word = words[-1]
            camel = self._to_camel_case_var(raw_name)
            if last_word in ["input", "field", "box"]:
                return f"input#{camel}"
            elif last_word in ["button", "btn"]:
                return f"button#{camel}"
            elif last_word in ["link", "anchor"]:
                return f"a.{camel}"
            return f"#{camel}"

    def _to_camel_case_var(self, text: str) -> str:
        text = re.sub(r'[^a-zA-Z0-9\s\-]', '', text)
        words = text.split()
        if not words:
            return "element"
        return words[0].lower() + "".join(w.capitalize() for w in words[1:])

    def _build_page_class(self, class_name: str, locators: Dict[str, Any], steps: List[Dict[str, Any]]) -> str:
        """Template for building page object models in TypeScript."""
        # Find goto URL
        goto_url = "https://example.com"
        for step in steps:
            if step["action"] == "goto" and step["value"]:
                goto_url = step["value"]
                break

        lines = [
            "import { Page, Locator } from '@playwright/test';",
            "",
            f"export class {class_name} {{",
            "  readonly page: Page;",
        ]

        # Declare locators properties
        for var, details in locators.items():
            lines.append(f"  readonly {var}: Locator; // Represents: {details['desc']}")

        # Add constructor
        lines.append("")
        lines.append("  constructor(page: Page) {")
        lines.append("    this.page = page;")
        for var, details in locators.items():
            lines.append(f"    this.{var} = page.locator('{details['css']}');")
        lines.append("  }")

        # Add goto method
        lines.append("")
        lines.append("  async goto() {")
        lines.append(f"    await this.page.goto('{goto_url}');")
        lines.append("  }")

        # Add action methods
        for var, details in locators.items():
            pasc = self._to_pascal_case(var)
            if "button" in details['desc'].lower() or "submit" in details['desc'].lower() or "link" in details['desc'].lower():
                lines.append("")
                lines.append(f"  async click{pasc}() {{")
                lines.append(f"    await this.{var}.click();")
                lines.append("  }")
            elif "field" in details['desc'].lower() or "input" in details['desc'].lower() or "box" in details['desc'].lower() or "username" in details['desc'].lower() or "password" in details['desc'].lower() or "email" in details['desc'].lower():
                lines.append("")
                lines.append(f"  async fill{pasc}(value: string) {{")
                lines.append(f"    await this.{var}.fill(value);")
                lines.append("  }")

        # Composite action for login if username and password fields are present
        if "usernameField" in locators and "passwordField" in locators and "loginButton" in locators:
            lines.append("")
            lines.append("  // High-level composite user action for login flow")
            lines.append("  async login(username: string, password: string) {")
            lines.append("    await this.usernameField.fill(username);")
            lines.append("    await this.passwordField.fill(password);")
            lines.append("    await this.loginButton.click();")
            lines.append("  }")

        lines.append("}")
        return "\n".join(lines)

    def _build_spec_file(self, class_name: str, page_filename: str, actions: List[Dict[str, Any]], assertions: List[Dict[str, Any]], feature_name: str) -> str:
        """Template for building test specs in TypeScript."""
        class_var = class_name.lower()
        import_path = f"./{page_filename.replace('.ts', '')}"
        
        lines = [
            "import { test, expect } from '@playwright/test';",
            f"import {{ {class_name} }} from '{import_path}';",
            "",
            f"test.describe('{feature_name} Tests', () => {{",
            f"  let {class_var}: {class_name};",
            "",
            "  test.beforeEach(async ({ page }) => {",
            f"    {class_var} = new {class_name}(page);",
            "  });",
            "",
            f"  test('Verify {feature_name} workflow successfully', async ({{ page }}) => {{",
        ]

        # Write actions
        lines.append("    // 1. Actions block")
        for act in actions:
            lines.append(f"    // Given/When: {act['desc']}")
            lines.append(f"    {act['code']}")
            
        # Write assertions
        lines.append("")
        lines.append("    // 2. Assertions / Expect block")
        for ass in assertions:
            lines.append(f"    // Then: {ass['desc']}")
            lines.append(f"    {ass['code']}")

        lines.append("  });")
        lines.append("});")
        return "\n".join(lines)
