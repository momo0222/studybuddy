import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { X, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from "lucide-react";

interface Question {
  question: string;
  options?: string[];
  answer: string;
  type: 'multiple-choice' | 'short-answer';
}

interface Note {
  id: string;
  title: string;
  subject: string;
  questions?: Question[];
}

interface QuizModeProps {
  note: Note;
  onComplete: (score: number) => void;
  onExit: () => void;
}

interface QuizResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export function QuizMode({ note, onComplete, onExit }: QuizModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer

  // Mock questions if none exist
  const mockQuestions: Question[] = [
    {
      question: "What is the main difference between mitosis and meiosis?",
      options: [
        "Mitosis produces 2 cells, meiosis produces 4",
        "Mitosis produces diploid cells, meiosis produces haploid cells",
        "Mitosis occurs in gametes, meiosis in somatic cells",
        "No difference between them"
      ],
      answer: "Mitosis produces diploid cells, meiosis produces haploid cells",
      type: 'multiple-choice'
    },
    {
      question: "During which phase of mitosis do chromosomes align at the cell's equator?",
      answer: "Metaphase",
      type: 'short-answer'
    },
    {
      question: "What process in meiosis increases genetic diversity?",
      options: [
        "DNA replication",
        "Crossing over",
        "Chromosome condensation",
        "Nuclear envelope breakdown"
      ],
      answer: "Crossing over",
      type: 'multiple-choice'
    },
    {
      question: "How many daughter cells are produced from one round of meiosis?",
      answer: "4",
      type: 'short-answer'
    },
    {
      question: "What is the chromosome number in human gametes?",
      options: ["46", "23", "92", "12"],
      answer: "23",
      type: 'multiple-choice'
    }
  ];

  const questions = note.questions || mockQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (quizComplete || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setQuizComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizComplete, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSubmit = () => {
    const isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
    
    const result: QuizResult = {
      question: currentQuestion.question,
      userAnswer,
      correctAnswer: currentQuestion.answer,
      isCorrect
    };

    setResults(prev => [...prev, result]);
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleSkip = () => {
    const result: QuizResult = {
      question: currentQuestion.question,
      userAnswer: 'Skipped',
      correctAnswer: currentQuestion.answer,
      isCorrect: false
    };

    setResults(prev => [...prev, result]);
    handleNext();
  };

  const calculateScore = () => {
    const correct = results.filter(r => r.isCorrect).length;
    return Math.round((correct / totalQuestions) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setShowAnswer(false);
    setQuizComplete(false);
    setResults([]);
    setTimeLeft(300);
  };

  if (quizComplete) {
    const score = calculateScore();
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const missedQuestions = results.filter(r => !r.isCorrect);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
              <Trophy className={`w-8 h-8 ${getScoreColor(score)}`} />
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <p className="text-muted-foreground">Here's how you performed</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}%
              </div>
              <p className="text-muted-foreground">
                {correctAnswers} out of {totalQuestions} questions correct
              </p>
            </div>

            {/* Performance Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-semibold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-green-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-semibold text-red-600">{totalQuestions - correctAnswers}</div>
                <div className="text-sm text-red-600">Incorrect</div>
              </div>
            </div>

            {/* Strengths & Areas for Improvement */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Strengths:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {score >= 80 && <li>• Excellent understanding of core concepts</li>}
                  {score >= 60 && <li>• Good grasp of fundamental principles</li>}
                  <li>• Completed the quiz within time limit</li>
                </ul>
              </div>

              {missedQuestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Areas for Improvement:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {missedQuestions.slice(0, 2).map((result, index) => (
                      <li key={index}>• {result.question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => onComplete(score)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue Studying
              </Button>
              <Button 
                variant="outline"
                onClick={handleRestart}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </Button>
            </div>

            {missedQuestions.length > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => alert('Review feature would show missed questions')}
              >
                Review Missed Questions
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onExit}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{note.title}</h1>
              <Badge variant="outline">{note.subject}</Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Time: {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-2">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Quiz Content */}
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-120px)]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xl">
              Question {currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Question */}
            <div className="text-lg text-foreground">
              {currentQuestion.question}
            </div>

            {/* Answer Options */}
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
              <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <Input
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={showAnswer}
              />
            )}

            {/* Answer Feedback */}
            {showAnswer && (
              <div className={`p-4 rounded-lg border ${
                results[results.length - 1]?.isCorrect 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {results[results.length - 1]?.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    results[results.length - 1]?.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results[results.length - 1]?.isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  <strong>Correct answer:</strong> {currentQuestion.answer}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              {!showAnswer ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleSkip}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button 
                    onClick={handleAnswerSubmit}
                    disabled={!userAnswer.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Check Answer
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Finish Quiz'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}