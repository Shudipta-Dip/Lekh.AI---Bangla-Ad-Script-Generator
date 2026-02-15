### **Implementation Plan: LekhAI Model Engineering & Fine-Tuning**

**Project Overview:** This plan outlines the creation of the "Brain" for **LekhAI**—a specialized Bengali Ad Script Generator. We are building a custom LLM by merging **TigerLLM** (Linguistic Soul) with **DeepSeek-R1-Distill-Qwen** (Logical Reasoning) and then fine-tuning it on a proprietary agency-grade dataset using **Unsloth**.

**The Workflow Context:** The output of this plan is a high-performance .ipynb file. Once the model is trained, we will deploy it to Hugging Face and connect it to a **Lovable** frontend, **Supabase** backend, and **Vercel** deployment.

### ---

**Phase 1: Environment Orchestration**

*Goal: Prepare the Google Colab environment with the high-performance Unsloth engine and merging tools.*

* **Step 1.1: Dependency Installation.** Install unsloth, xformers, peft, and mergekit.  
* **Step 1.2: Library Imports.** Initialize PyTorch, Transformers, and Unsloth utilities.  
* **Step 1.3: Hugging Face Authentication.** Securely log in to Hugging Face to access base models and save the final "LekhAI" weights.

### **Phase 2: The "Sutro" Fusion (Model Merging)**

*Goal: Blend the distinct strengths of three models into a single base for LekhAI.*

* **Step 2.1: Merge Configuration.** Write the config.yaml for SLERP merging.  
* **Step 2.2: Executing Mergekit.** Run the merge between **Tiger-7B** and **DeepSeek-R1-Distill-Qwen-7B**.  
* **Step 2.3: Tokenizer Synchronization.** Ensure the Bengali vocabulary from Tiger is preserved during the logic-heavy Qwen merge.

### **Phase 3: Data Architecture & Pre-processing**

*Goal: Convert the CSV dataset into a format the model can "digest."*

* **Step 3.1: CSV Loading.** Load Ad Script Dataset \- Scripts.csv using Pandas.  
* **Step 3.2: Formatting the Chat Template.** Map the system\_prompt, prompt\_1, and script columns into the "User-Assistant" conversational structure.  
  * **Future Expansion:** Train on prompt\_2 and prompt\_3 columns to triple the effective dataset size (306 examples from 102 rows).  
* **Step 3.3: Tokenization.** Convert text into numbers (tokens) with proper padding so the model understands the start and end of scripts.

### **Phase 4: Base Model Loading (The 4-bit Foundation)**

*Goal: Load the merged model efficiently using Unsloth to stay within free Colab VRAM limits.*

* **Step 4.1: Unsloth Model Loading.** Initialize the merged model in **4-bit quantization**.  
* **Step 4.2: LoRA Configuration.** Setup PEFT (Parameter-Efficient Fine-Tuning) to only train the "creative layers" of the model.

### **Phase 5: The "Vibe Check" (Pre-Training Evaluation)**

*Goal: Test the model BEFORE training to establish a baseline performance.*

* **Step 5.1: Inference Setup.** Create a small function to generate a script from a prompt.  
* **Step 5.2: Baseline Test.** Run a prompt (e.g., "Write a Berger paint ad") and observe how "generic" the response is compared to our dataset.

### **Phase 6: Iterative Fine-Tuning**

*Goal: Train the model on the Agency-Grade dataset to learn the "X Integrated" style.*

* **Step 6.1: Trainer Setup.** Configure the SFTTrainer with specific learning rates and batch sizes.  
* **Step 6.2: Training Loop.** Execute the training.  
* **Step 6.3: Loss Monitoring.** Log the training loss to ensure the model is actually learning and not just memorizing.

### **Phase 7: Deep Performance Refinement**

*Goal: Polish the output quality and ensure the Markdown tables are consistent.*

* **Step 7.1: Post-Training Test.** Run the same "Berger" prompt from Step 5.2 and compare the results.  
* **Step 7.2: Table Validation.** Verify that the model now outputs scripts in the | Visual | Audio | Markdown format by default.  
* **Step 7.3: Tone & Industry Verification.** Test if changing the "Tone" button in the prompt actually changes the vocabulary used by the model.

### **Phase 8: Model Export & Deployment Readiness**

*Goal: Save the finished LekhAI model for use in the Lovable/Supabase app.*

* **Step 8.1: Saving LoRA Adapters.** Save the small "brain upgrade" files.  
* **Step 8.2: Merging for GGUF/Ollama (Optional).** Prepare the model for local desktop use.  
* **Step 8.3: Hugging Face Push.** Upload the final model weights to your repository.

### ---

**Instructions for Antigravity AI Agent:**

1. **Code Granularity:** Generate code in **very small, modular blocks**. For example, do not combine "Loading Data" and "Formatting Data" into one cell. Break them into two separate cells with individual explanations.  
2. **Plain English Explanations:** For every code block, provide a **Markdown cell** above it titled \#\#\# Explanation. Use layman’s terms suitable for a BBA student. Avoid overly technical jargon like "Gradient Accumulation" unless you explain it as "Managing the model's memory during learning."  
3. **Interview Prep Notes:** Include "Key Concepts" in the markdown that explain *why* we are using **Unsloth** (Speed/Memory) or **LoRA** (Efficient Fine-Tuning).  
4. **Formatting Requirement:** Ensure the model's response generation functions specifically support the Markdown table structure found in the dataset.

### ---

**Phase 9: Future Integration Context**

*Note: This .ipynb represents the core engine. Once complete, we will:*

1. Host this model as an API.  
2. Use **Lovable** to build the UI with "Industry" and "Tone" sliders.  
3. Store user-generated scripts in **Supabase**.  
4. Deploy the final product on **Vercel**.

---

### **Phase 10: Preference Alignment (DPO \- Direct Preference Optimization)**

*Goal: Move beyond just "imitating" scripts to teaching the model the difference between a high-converting script and a generic one.*

* **Step 10.1: Preference Pair Creation.** Construct a "Chosen" vs. "Rejected" dataset. The model learns to favor the "Chosen" (your high-quality agency scripts) over "Rejected" (generic ChatGPT-style scripts).  
* **Step 10.2: DPO Loss Function Setup.** Configure the `DPOTrainer` from the TRL (Transformer Reinforcement Learning) library.  
* **Step 10.3: Policy Alignment.** Run the alignment training. This "nudges" the model’s probability distribution toward the professional "LekhAI" style without losing the base reasoning of DeepSeek.

### **Phase 11: Systematic Evaluation (LLM-as-a-Judge)**

*Goal: Move from "Vibe Checks" to quantitative data using a larger model (like Gemini 1.5 Pro or GPT-4o) to grade your model’s output.*

* **Step 11.1: Defining the Rubric.** Create a scoring system (1-10) for "Bangla Fluency," "Ad Structure," and "Tone Accuracy."  
* **Step 11.2: Automated Batch Grading.** Use an API to have a "Judge LLM" grade 20 outputs from LekhAI.  
* **Step 11.3: Error Analysis & Heatmaps.** Visualize which industries (e.g., Real Estate vs. FMCG) the model struggles with to identify where more data is needed.

### **Phase 12: Quantization & Local Portability (GGUF & EXL2)**

*Goal: Optimize the model so it can actually run on your 8GB RAM desktop or laptop without a cloud GPU.*

* **Step 12.1: BitsandBytes 4-bit Export.** Export the fine-tuned weights into a highly compressed format.  
* **Step 12.2: GGUF Conversion.** Use `llama.cpp` utilities to convert the model to GGUF format for use in local tools like LM Studio or Ollama.  
* **Step 12.3: VRAM Benchmarking.** Measure the memory "footprint" to ensure the model runs smoothly on the hardware specs of the target user (Drabir Alam).


