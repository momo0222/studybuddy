#!/usr/bin/env python3
"""
Real interactive Active Recall session where users can actually respond.
This provides a true back-and-forth conversation with the AI tutor.
"""

import os
import sys
from recall import ActiveRecallSystem, setup_dummy_data

class InteractiveSession:
    def __init__(self, system: ActiveRecallSystem):
        self.system = system
        self.current_conversation = None
    
    def start_session(self):
        """Start an interactive study session"""
        print("\n" + "="*60)
        print("🧠 INTERACTIVE ACTIVE RECALL SESSION")
        print("="*60)
        
        # Show available concepts
        concepts_due = self.system.db.get_concepts_due_for_review()
        if not concepts_due:
            print("📚 No concepts are due for review right now!")
            return
        
        print(f"\n📚 Available concepts to study:")
        for i, concept in enumerate(concepts_due[:5], 1):  # Show first 5
            print(f"   {i}. {concept.name} (Mastery: {concept.mastery_level.name})")
        
        # Let user choose concept
        while True:
            try:
                choice = input(f"\nChoose a concept (1-{min(5, len(concepts_due))}) or 'q' to quit: ").strip()
                if choice.lower() == 'q':
                    return
                
                concept_index = int(choice) - 1
                if 0 <= concept_index < len(concepts_due):
                    selected_concept = concepts_due[concept_index]
                    break
                else:
                    print("❌ Invalid choice. Please try again.")
            except ValueError:
                print("❌ Please enter a number or 'q' to quit.")
        
        # Start interactive conversation
        self.run_conversation(selected_concept)
    
    def run_conversation(self, concept):
        """Run the actual interactive conversation"""
        print(f"\n🎯 Starting session with: {concept.name}")
        print(f"📈 Current mastery: {concept.mastery_level.name}")
        print(f"🔄 Times reviewed: {concept.review_count}")
        
        # Start the conversation
        self.current_conversation = self.system.start_interactive_session(concept.id)
        
        print(f"\n🤖 Tutor: {self.current_conversation.original_question}")
        
        conversation_active = True
        while conversation_active:
            # Get user input
            print("\n" + "-"*50)
            user_response = input("👤 Your response (or type '?' to ask a question): ").strip()
            
            if user_response.lower() in ['quit', 'exit', 'q']:
                print("📚 Session ended. Progress saved!")
                break
            
            if not user_response:
                print("❌ Please provide a response or type 'quit' to exit.")
                continue
            
            # Check if user is asking a question
            if user_response.startswith('?') or any(word in user_response.lower() for word in ['what is', 'how do', 'why does', 'can you explain', 'what does']):
                # Handle user question
                result = self.system.handle_user_question(self.current_conversation, user_response)
                print(f"\n🤖 Tutor: {result['answer']}")
                
                # Ask a follow-up question to continue the learning
                if result.get('follow_up_question'):
                    print(f"\n🤖 Tutor: {result['follow_up_question']}")
            else:
                # Process as normal answer to tutor's question
                result = self.system.continue_conversation(self.current_conversation, user_response)
                
                # Show the AI tutor's guiding response
                print(f"\n🤖 Tutor: {result['guiding_response']}")
            
            # The conversation continues until user decides to end it
        
        # End the conversation and record session
        if self.current_conversation:
            end_result = self.system.end_conversation(self.current_conversation)
            print(f"\n🎉 Session complete!")
            print(f"📈 Total exchanges: {end_result['total_attempts']}")
            if end_result.get('remediation_needed', False):
                print(f"🎯 This concept has been marked for additional review.")
        
        # Show progress after session
        self.show_progress_update(concept)
    
    def show_progress_update(self, concept):
        """Show updated progress after session"""
        updated_concept = self.system.db.get_concept(concept.id)
        weaknesses = self.system.db.get_concept_weaknesses(concept.id)
        
        print(f"\n📊 Progress Update for {concept.name}:")
        print(f"   Mastery Level: {concept.mastery_level.name} → {updated_concept.mastery_level.name}")
        print(f"   Review Count: {concept.review_count} → {updated_concept.review_count}")
        print(f"   Correct Streak: {concept.correct_streak} → {updated_concept.correct_streak}")
        
        if weaknesses:
            print(f"\n🎯 Tracked Weaknesses:")
            for weakness in weaknesses:
                print(f"   • {weakness['area']} (Severity: {weakness['severity']}, Times: {weakness['times_encountered']})")
    
    def run_multiple_sessions(self):
        """Run multiple study sessions in a row"""
        print("🚀 Welcome to Interactive Active Recall!")
        print("Type 'help' for commands or start studying!")
        
        while True:
            print("\n" + "="*40)
            command = input("Enter command (study/progress/help/quit): ").strip().lower()
            
            if command in ['quit', 'exit', 'q']:
                print("👋 Goodbye! Keep studying!")
                break
            elif command in ['study', 's']:
                self.start_session()
            elif command in ['progress', 'p']:
                self.show_overall_progress()
            elif command in ['help', 'h']:
                self.show_help()
            else:
                print("❌ Unknown command. Type 'help' for available commands.")
    
    def show_overall_progress(self):
        """Show overall study progress"""
        progress = self.system.get_study_progress()
        
        print("\n📊 Overall Study Progress:")
        print(f"   Total Concepts: {progress['total_concepts']}")
        print(f"   Due for Review: {progress['concepts_due_for_review']}")
        
        if progress['mastery_distribution']:
            print(f"\n📈 Mastery Distribution:")
            for level, count in progress['mastery_distribution'].items():
                print(f"   {level}: {count} concepts")
        
        # Show concepts with most weaknesses
        print(f"\n🎯 Concepts Needing Attention:")
        concepts_due = self.system.db.get_concepts_due_for_review()
        for concept in concepts_due[:3]:
            weaknesses = self.system.db.get_concept_weaknesses(concept.id)
            weakness_count = len(weaknesses)
            print(f"   • {concept.name}: {weakness_count} tracked weaknesses")
    
    def show_help(self):
        """Show help information"""
        print("\n📖 Available Commands:")
        print("   study (s)    - Start a new study session")
        print("   progress (p) - View your overall progress")
        print("   help (h)     - Show this help message")
        print("   quit (q)     - Exit the program")
        
        print("\n💡 During Study Sessions:")
        print("   • Answer questions naturally")
        print("   • Type 'quit' to end session early")
        print("   • The AI tutor will guide you with leading questions")
        print("   • Sessions adapt based on your responses")

def main():
    """Main function to run interactive sessions"""
    print("🚀 Starting Interactive Active Recall System")
    
    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("\n⚠️  ANTHROPIC_API_KEY not found!")
        print("   Please set your API key: export ANTHROPIC_API_KEY='your-key-here'")
        print("   The system needs Claude AI for interactive conversations.")
        return 1
    
    try:
        # Initialize system
        system = ActiveRecallSystem(api_key, "interactive_session.db")
        
        # Set up dummy data if no concepts exist
        progress = system.get_study_progress()
        if progress['total_concepts'] == 0:
            print("📚 Setting up initial study materials...")
            setup_dummy_data(system)
        
        # Start interactive session
        session = InteractiveSession(system)
        session.run_multiple_sessions()
        
    except KeyboardInterrupt:
        print("\n\n👋 Session interrupted. Progress saved!")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
