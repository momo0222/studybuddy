#!/usr/bin/env python3
"""
Interactive test to demonstrate the conversational Active Recall features.
This shows the back-and-forth dialogue system with leading questions.
"""

import os
import sys
from recall import ActiveRecallSystem, setup_dummy_data

def simulate_interactive_conversation(system: ActiveRecallSystem):
    """Simulate an interactive conversation with leading questions"""
    print("\n" + "="*70)
    print("🤖 INTERACTIVE CONVERSATIONAL ACTIVE RECALL")
    print("="*70)
    
    # Get a concept to work with
    concepts_due = system.db.get_concepts_due_for_review()
    if not concepts_due:
        print("No concepts available for testing")
        return
    
    concept = concepts_due[0]  # Use first available concept
    print(f"\n📚 Testing Interactive Session with: {concept.name}")
    print(f"🎯 Current Mastery Level: {concept.mastery_level.name}")
    
    # Start interactive session
    conversation_state = system.start_interactive_session(concept.id)
    
    print(f"\n🤖 Tutor: {conversation_state.original_question}")
    
    # Simulate different types of student responses
    student_responses = [
        # First response - intentionally incomplete/wrong
        "I think it's just a way to store data",
        
        # Second response - showing some improvement after leading question
        "Arrays store elements in memory and you can access them with an index",
        
        # Third response - more detailed after another leading question
        "Arrays store elements in contiguous memory locations, which allows for O(1) constant time access using indices. The elements are of the same type and the array has a fixed size."
    ]
    
    conversation_complete = False
    response_index = 0
    
    while not conversation_complete and response_index < len(student_responses):
        user_response = student_responses[response_index]
        print(f"\n👤 Student: {user_response}")
        
        # Continue the conversation
        result = system.continue_conversation(conversation_state, user_response)
        
        print(f"\n📊 Status: {result['status']}")
        print(f"✅ Correct: {result['correct']}")
        print(f"💬 Feedback: {result['feedback']}")
        
        if 'leading_question' in result:
            print(f"\n🤖 Tutor (Leading Question): {result['leading_question']}")
        
        if 'weaknesses_identified' in result:
            print(f"🎯 Weaknesses Identified: {', '.join(result['weaknesses_identified'])}")
        
        if 'attempts' in result:
            print(f"🔄 Attempts: {result['attempts']}")
        
        conversation_complete = result.get('conversation_complete', False)
        response_index += 1
        
        print("-" * 50)
    
    # Show final results
    if conversation_complete:
        print(f"\n🎉 Conversation Complete!")
        if 'total_attempts' in result:
            print(f"📈 Total Attempts: {result['total_attempts']}")
        if 'remediation_needed' in result:
            print(f"🔧 Remediation Needed: {result['remediation_needed']}")
    
    # Show tracked weaknesses
    weaknesses = system.db.get_concept_weaknesses(concept.id)
    if weaknesses:
        print(f"\n🎯 Tracked Weaknesses for {concept.name}:")
        for weakness in weaknesses:
            print(f"   • {weakness['area']} (Severity: {weakness['severity']}, Times: {weakness['times_encountered']})")

def demonstrate_weakness_tracking(system: ActiveRecallSystem):
    """Demonstrate how the system tracks and prioritizes concept weaknesses"""
    print("\n" + "="*70)
    print("🎯 WEAKNESS TRACKING & PRIORITIZATION DEMO")
    print("="*70)
    
    # Get all concepts and show their weaknesses
    concepts_due = system.db.get_concepts_due_for_review()
    
    for concept in concepts_due[:3]:  # Show first 3 concepts
        weaknesses = system.db.get_concept_weaknesses(concept.id)
        print(f"\n📚 {concept.name}")
        print(f"   Mastery Level: {concept.mastery_level.name}")
        print(f"   Review Count: {concept.review_count}")
        print(f"   Correct Streak: {concept.correct_streak}")
        
        if weaknesses:
            print(f"   🎯 Known Weaknesses:")
            for weakness in weaknesses:
                print(f"      • {weakness['area']} (Severity: {weakness['severity']}, Encountered: {weakness['times_encountered']}x)")
        else:
            print(f"   ✅ No specific weaknesses identified yet")

def demonstrate_adaptive_questioning():
    """Show how questions adapt based on conversation history"""
    print("\n" + "="*70)
    print("🔄 ADAPTIVE QUESTIONING FLOW")
    print("="*70)
    
    print("\n📋 How the Interactive System Works:")
    
    print("\n1️⃣ INITIAL QUESTION")
    print("   • System generates question based on mastery level")
    print("   • Student provides initial answer")
    
    print("\n2️⃣ ANSWER EVALUATION")
    print("   • ✅ If CORRECT: Session ends, mastery may increase")
    print("   • ❌ If INCORRECT: System identifies specific weaknesses")
    
    print("\n3️⃣ LEADING QUESTIONS")
    print("   • System generates Socratic questions to guide understanding")
    print("   • Questions break down concept into manageable parts")
    print("   • AI uses conversation history to personalize questions")
    
    print("\n4️⃣ IMPROVEMENT TRACKING")
    print("   • System evaluates if responses show improvement")
    print("   • Looks for: longer responses, technical terms, structured thinking")
    
    print("\n5️⃣ SESSION COMPLETION")
    print("   • Success: Student shows clear improvement")
    print("   • Timeout: After 4 attempts, session ends with encouragement")
    print("   • Weakness tracking: Specific gaps recorded for future focus")
    
    print("\n🎯 WEAKNESS CATEGORIES TRACKED:")
    categories = [
        "Definitions and terminology",
        "Time complexity understanding", 
        "Implementation details",
        "Use cases and applications",
        "Conceptual relationships",
        "Problem-solving approach"
    ]
    
    for i, category in enumerate(categories, 1):
        print(f"   {i}. {category}")

def main():
    """Main function to run the interactive demonstration"""
    print("🚀 Starting Interactive Active Recall Demonstration")
    
    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n⚠️  Warning: ANTHROPIC_API_KEY not found in environment variables")
        print("   Using fallback responses for demonstration")
        api_key = "dummy-key-for-demo"
    
    try:
        # Initialize the system
        print("\n🔧 Initializing Interactive Active Recall System...")
        system = ActiveRecallSystem(api_key, "interactive_demo.db")
        
        # Set up dummy data
        print("📚 Setting up study materials...")
        setup_dummy_data(system)
        
        # Run demonstrations
        demonstrate_adaptive_questioning()
        demonstrate_weakness_tracking(system)
        simulate_interactive_conversation(system)
        
        print(f"\n💾 Database saved as: interactive_demo.db")
        print("   Contains conversation history and weakness tracking data")
        
    except Exception as e:
        print(f"\n❌ Error during demonstration: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
