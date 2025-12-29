import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EISnapshot {
  state?: string;
  score?: number;
}

export default function OraclePage() {
  const [question, setQuestion] = useState("");

  // Get latest EI snapshot for context
  const { data: eiData } = useQuery<EISnapshot>({
    queryKey: ["/api/ei/latest"],
  });

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/oracle/ask", {
        question,
        eiContext: eiData ? {
          state: eiData.state,
          score: eiData.score
        } : undefined
      });
      return response.json();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      askMutation.mutate(question);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Oracle AI Mentor
          </CardTitle>
          <CardDescription>
            Ask Oracle for guidance on mental wellness, decision-making, and founder challenges.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="What's on your mind? Ask Oracle for guidance..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-oracle-question"
            />
            <Button
              type="submit"
              disabled={askMutation.isPending || !question.trim()}
              data-testid="button-ask-oracle"
            >
              {askMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Ask Oracle</span>
            </Button>
          </form>

          {askMutation.data?.answer && (
            <Card className="bg-muted">
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap" data-testid="text-oracle-response">
                  {askMutation.data.answer}
                </p>
              </CardContent>
            </Card>
          )}

          {askMutation.error && (
            <div className="text-destructive text-sm" data-testid="text-oracle-error">
              Failed to get response. Please try again.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
