import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Send, Brain, User, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Oracle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: latestEI } = useQuery<{ state: string }>({
    queryKey: ["/api/ei/latest"],
    enabled: !!user,
  });

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/oracle/ask", {
        question,
        eiContext: latestEI,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    askMutation.mutate(input);
    setInput("");
  };

  const suggestedQuestions = [
    "How can I manage founder stress better?",
    "What's the best decision-making framework for high-pressure situations?",
    "How do I maintain work-life balance as a founder?",
    "What are signs of founder burnout?",
  ];

  return (
    <>
      <Header
        title='"Oracle"'
        subtitle="AI Mentor - Your personal AI advisor for mental wellness and decision support"
        userName={user?.name || ""}
      />

      <div className="max-w-5xl mx-auto px-8 py-8 h-[calc(100vh-180px)] flex flex-col">
        <Card className="flex-1 flex flex-col bg-card border-border">
          <CardContent className="flex-1 flex flex-col p-6">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                    <Brain className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold">
                    "Oracle"{" "}
                    <span className="text-primary text-lg">AI Mentor</span>
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask me anything about mental wellness, decision-making, or
                    founder challenges. I'm here to provide personalized
                    guidance based on your current state.
                  </p>
                  {latestEI && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm">
                      <Sparkles className="h-4 w-4" />
                      Current State:{" "}
                      <span className="font-semibold">{latestEI.state}</span>
                    </div>
                  )}
                </div>

                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Try asking:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedQuestions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-left justify-start h-auto py-3 px-4"
                        onClick={() => setInput(question)}
                        data-testid={`button-suggestion-${idx}`}
                      >
                        <span className="text-sm">{question}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea ref={scrollRef} className="flex-1 pr-4">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                      data-testid={`message-${message.role}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {askMutation.isPending && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI Oracle anything..."
                  className="flex-1"
                  disabled={askMutation.isPending}
                  data-testid="input-oracle-question"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || askMutation.isPending}
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
