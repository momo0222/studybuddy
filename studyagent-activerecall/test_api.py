#!/usr/bin/env python3
"""
Simple test to verify Anthropic API key and model availability
"""

import os
import anthropic

def test_anthropic_api():
    """Test the Anthropic API connection and model"""
    
    # Check if API key is available
    api_key = os.getenv("ANTHROPIC_API_KEY")
    print(f"API Key found: {'Yes' if api_key else 'No'}")
    if api_key:
        print(f"API Key starts with: {api_key[:10]}...")
    
    if not api_key:
        print("❌ No API key found. Please set ANTHROPIC_API_KEY environment variable.")
        return False
    
    try:
        # Initialize client
        client = anthropic.Anthropic(api_key=api_key)
        print("✅ Client initialized successfully")
        
        # Test different model names
        models_to_test = [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-sonnet-20240620",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
            "claude-3-opus-20240229",
            "claude-3-5-haiku-20241022"
        ]
        
        for model in models_to_test:
            try:
                print(f"\n🧪 Testing model: {model}")
                response = client.messages.create(
                    model=model,
                    max_tokens=50,
                    messages=[{"role": "user", "content": "Say hello in one word."}]
                )
                print(f"✅ {model} works! Response: {response.content[0].text}")
                return model
            except Exception as e:
                print(f"❌ {model} failed: {str(e)}")
        
        print("❌ No working model found")
        return False
        
    except Exception as e:
        print(f"❌ API test failed: {str(e)}")
        return False

if __name__ == "__main__":
    working_model = test_anthropic_api()
    if working_model:
        print(f"\n🎉 Use this model in your code: {working_model}")
