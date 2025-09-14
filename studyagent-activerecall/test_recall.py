#!/usr/bin/env python3
"""
Test file to demonstrate the Active Recall functionality.
This simulates a complete study session with interactive Q&A.
"""

# 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

import os
import sys
from recall import ActiveRecallSystem, setup_dummy_data

def simulate_study_session(system: ActiveRecallSystem):
    """Simulate an interactive study session"""
    print("\n" + "="*60)
    print("🧠 STUDYAGENT ACTIVE RECALL SESSION")
    print("="*60)
    
    # Show current progress
    progress = system.get_study_progress()
    print(f"\n📊 Study Progress:")
    print(f"   Total Concepts: {progress['total_concepts']}")
    print(f"   Due for Review: {progress['concepts_due_for_review']}")
    print(f"   Mastery Distribution: {progress['mastery_distribution']}")
    
    session_count = 0
    max_sessions = 5  # Limit for demo purposes
    
    while session_count < max_sessions:
        print(f"\n{'='*40}")
        print(f"📚 Study Session {session_count + 1}")
        print(f"{'='*40}")
        
        # Start a study session
        result = system.start_study_session()
        if not result:
            print("✅ No more concepts due for review!")
            break
        
        concept, question = result
        
        print(f"\n🎯 Topic: {concept.name}")
        print(f"📈 Current Mastery: {concept.mastery_level.name}")
        print(f"🔄 Review Count: {concept.review_count}")
        print(f"🔥 Correct Streak: {concept.correct_streak}")
        
        print(f"\n❓ Question ({question.difficulty.name} - {question.question_type}):")
        print(f"   {question.question_text}")
        
        # Simulate different types of answers for demonstration
        sample_answers = [
            # Good answer for arrays
            "Arrays store elements in contiguous memory with O(1) access time using indices. They have fixed size and elements can be accessed directly.",
            
            # Partial answer for linked lists  
            "Linked lists have nodes with data and pointers. They are dynamic size.",
            
            # Poor answer for stacks
            "It's like a pile of things.",
            
            # Good answer for any concept
            "This is a fundamental data structure with specific properties for organizing and accessing data efficiently.",
            
            # Another partial answer
            "I think it has something to do with memory and performance."
        ]
        
        # Use a sample answer (in real implementation, this would be user input)
        user_answer = sample_answers[session_count % len(sample_answers)]
        print(f"\n💭 Simulated Answer: {user_answer}")
        
        # Submit the answer and get feedback
        result = system.submit_answer(concept, question, user_answer)
        
        print(f"\n📝 Evaluation:")
        print(f"   ✓ Correct: {'Yes' if result['correct'] else 'No'}")
        print(f"   📋 Feedback: {result['feedback']}")
        
        if result['hints']:
            print(f"   💡 Hints:")
            for i, hint in enumerate(result['hints'], 1):
                print(f"      {i}. {hint}")
        
        print(f"   📊 Updated Mastery: {result['mastery_level']}")
        
        session_count += 1
        
        # Show updated progress
        progress = system.get_study_progress()
        print(f"\n📈 Updated Progress: {progress['mastery_distribution']}")
    
    print(f"\n{'='*60}")
    print("🎉 Study Session Complete!")
    print("="*60)
    
    # Final progress report
    final_progress = system.get_study_progress()
    print(f"\n📊 Final Progress Summary:")
    print(f"   Total Concepts: {final_progress['total_concepts']}")
    print(f"   Still Due for Review: {final_progress['concepts_due_for_review']}")
    print(f"   Mastery Distribution:")
    for level, count in final_progress['mastery_distribution'].items():
        print(f"      {level}: {count} concepts")

def demonstrate_adaptive_difficulty():
    """Demonstrate how questions adapt based on mastery level"""
    print("\n" + "="*60)
    print("🎯 ADAPTIVE DIFFICULTY DEMONSTRATION")
    print("="*60)
    
    # This would show how questions get harder as mastery increases
    print("\n📚 How Active Recall Adapts:")
    print("\n🔰 UNKNOWN/LEARNING Level:")
    print("   - Question Type: Recall")
    print("   - Difficulty: Basic")
    print("   - Example: 'What is the time complexity of array access?'")
    
    print("\n🔸 FAMILIAR Level:")
    print("   - Question Type: Recall or Application")
    print("   - Difficulty: Intermediate") 
    print("   - Example: 'Compare arrays vs linked lists for a specific use case'")
    
    print("\n🔹 PROFICIENT Level:")
    print("   - Question Type: Application or Synthesis")
    print("   - Difficulty: Advanced")
    print("   - Example: 'Design a data structure that combines benefits of arrays and linked lists'")
    
    print("\n🏆 MASTERED Level:")
    print("   - Question Type: Synthesis")
    print("   - Difficulty: Expert")
    print("   - Example: 'Analyze the trade-offs in a complex system using multiple data structures'")

def demonstrate_spaced_repetition():
    """Demonstrate the spaced repetition algorithm"""
    print("\n" + "="*60)
    print("📅 SPACED REPETITION ALGORITHM")
    print("="*60)
    
    print("\n🔄 Review Intervals Based on Mastery:")
    print("   UNKNOWN: 1 day (needs immediate review)")
    print("   LEARNING: 2 days")
    print("   FAMILIAR: 4 days") 
    print("   PROFICIENT: 7 days (1 week)")
    print("   MASTERED: 14 days (2 weeks)")
    
    print("\n❌ If Answer is Incorrect:")
    print("   - Review interval resets to 1 day")
    print("   - Mastery level may decrease")
    print("   - Correct streak resets to 0")
    
    print("\n✅ If Answer is Correct:")
    print("   - Correct streak increases")
    print("   - After 3 correct answers, mastery level increases")
    print("   - Review interval extends based on new mastery level")

def main():
    """Main function to run the demonstration"""
    print("🚀 Starting StudyAgent Active Recall Demonstration")
    
    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n⚠️  Warning: ANTHROPIC_API_KEY not found in environment variables")
        print("   The system will use fallback questions instead of Claude-generated ones")
        print("   To use full functionality, set your Anthropic API key:")
        print("   export ANTHROPIC_API_KEY='your-api-key-here'")
        
        # For demo purposes, we'll use a dummy key
        api_key = "dummy-key-for-demo"
    
    try:
        # Initialize the system
        print("\n🔧 Initializing Active Recall System...")
        system = ActiveRecallSystem(api_key, "demo_active_recall.db")
        
        # Set up dummy data
        print("📚 Setting up dummy study materials...")
        setup_dummy_data(system)
        
        # Run demonstrations
        demonstrate_adaptive_difficulty()
        demonstrate_spaced_repetition()
        simulate_study_session(system)
        
        print(f"\n💾 Database saved as: demo_active_recall.db")
        print("   You can examine the database to see stored progress and sessions")
        
    except Exception as e:
        print(f"\n❌ Error during demonstration: {str(e)}")
        print("   This might be due to missing dependencies or API issues")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
