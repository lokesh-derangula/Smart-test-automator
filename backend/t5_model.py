import os
import torch
import pandas as pd
from transformers import T5ForConditionalGeneration, T5Tokenizer

class T5FineTuner:
    """
    Manages local Hugging Face T5 loading, training (fine-tuning) on CPU,
    and text generation for Agile User Stories to Gherkin translation.
    """
    def __init__(self, model_name="t5-small"):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.is_trained = False
        
    def load_model(self):
        """Loads T5 model and tokenizer from cache/HuggingFace."""
        if self.model is None:
            # T5 requires sentencepiece, which is bundled in transformers
            self.tokenizer = T5Tokenizer.from_pretrained(self.model_name, legacy=False)
            self.model = T5ForConditionalGeneration.from_pretrained(self.model_name)
            
    def train(self, csv_path: str, epochs: int, progress_callback=None):
        """Runs a real PyTorch training loop on the uploaded dataset."""
        self.load_model()
        
        # Load dataset using pandas
        df = pd.read_csv(csv_path)
        if "Story" not in df.columns or "Criteria" not in df.columns:
            raise ValueError("CSV must contain 'Story' and 'Criteria' columns.")
            
        stories = df["Story"].dropna().tolist()
        criteria = df["Criteria"].dropna().tolist()
        
        # Format dataset for T5 translation task
        inputs = ["translate Story to Gherkin: " + str(s) for s in stories]
        targets = [str(c) for c in criteria]
        
        # Keep training highly responsive on CPU by training on a subset of samples (8 samples)
        # This keeps the training loop real (actually updates PyTorch weights) while finishing in seconds.
        max_samples = 8
        inputs = inputs[:max_samples]
        targets = targets[:max_samples]
        
        # Initialize AdamW optimizer
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=1e-4)
        self.model.train()
        
        for epoch in range(1, epochs + 1):
            epoch_loss = 0.0
            
            for input_str, target_str in zip(inputs, targets):
                # Tokenize input and target
                input_ids = self.tokenizer.encode(input_str, return_tensors="pt")
                labels = self.tokenizer.encode(target_str, return_tensors="pt")
                
                # Forward pass
                outputs = self.model(input_ids=input_ids, labels=labels)
                loss = outputs.loss
                
                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
                
            avg_loss = epoch_loss / len(inputs)
            
            # Yield progress to the callback (epoch loss)
            if progress_callback:
                progress_callback(epoch, avg_loss)
                
        # Save model state locally
        torch.save(self.model.state_dict(), "t5_finetuned_weights.pt")
        self.is_trained = True
        
    def generate(self, story: str, fallback_parser) -> str:
        """
        Translates a User Story to Gherkin format using the T5 model.
        Uses a hybrid approach: translates via T5, then cleans/structures
        using a fallback rule-based parser if the output lacks Gherkin markers.
        """
        self.load_model()
        
        # Load saved weights if they exist
        if os.path.exists("t5_finetuned_weights.pt") and not self.is_trained:
            try:
                self.model.load_state_dict(torch.load("t5_finetuned_weights.pt", map_location=torch.device('cpu')))
                self.is_trained = True
            except Exception as e:
                print(f"Error loading T5 weights: {e}")
                
        # Run inference
        input_str = "translate Story to Gherkin: " + story
        input_ids = self.tokenizer.encode(input_str, return_tensors="pt")
        
        self.model.eval()
        with torch.no_grad():
            outputs = self.model.generate(
                input_ids,
                max_length=256,
                num_beams=2,
                early_stopping=True
            )
            
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Hybrid cleaning: if generated text lacks clear BDD structure (Given/When/Then),
        # use the fallback parser to structure it properly.
        has_gherkin_keywords = any(kw in generated_text for kw in ["Given", "When", "Then", "Scenario:", "Feature:"])
        
        if not has_gherkin_keywords:
            # Fallback to structuring Gherkin from the user story
            return fallback_parser.to_gherkin(story, generated_text or story)
            
        return generated_text
