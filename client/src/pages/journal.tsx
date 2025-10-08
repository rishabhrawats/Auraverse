import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EncryptedEditor } from "@/components/journal/encrypted-editor";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { decryptJournalEntry } from "@/lib/crypto";
import type { Journal } from "@/types";

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Fetch journals
  const { data: journals, isLoading } = useQuery<Journal[]>({
    queryKey: ["/api/journal"],
    enabled: !!user,
  });

  // Save journal mutation
  const saveJournalMutation = useMutation({
    mutationFn: async ({ bodyCipher, title, tags }: { bodyCipher: string; title: string; tags: string[] }) => {
      const response = await apiRequest("POST", "/api/journal", {
        bodyCipher,
        title,
        tags,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete journal mutation
  const deleteJournalMutation = useMutation({
    mutationFn: async (journalId: string) => {
      await apiRequest("DELETE", `/api/journal/${journalId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Entry Deleted",
        description: "Journal entry has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Decrypt and display journal content
  const [decryptedContents, setDecryptedContents] = useState<Record<string, { title: string; content: string; timestamp: string }>>({});

  const handleDecryptEntry = async (journal: Journal) => {
    if (decryptedContents[journal.id]) {
      setExpandedEntry(expandedEntry === journal.id ? null : journal.id);
      return;
    }

    try {
      const decrypted = await decryptJournalEntry(journal.bodyCipher, user?.id || "");
      setDecryptedContents(prev => ({
        ...prev,
        [journal.id]: decrypted
      }));
      setExpandedEntry(journal.id);
    } catch (error) {
      toast({
        title: "Decryption Failed",
        description: "Unable to decrypt this entry. The encryption key may have changed.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = (journalId: string) => {
    if (confirm("Are you sure you want to delete this journal entry? This action cannot be undone.")) {
      deleteJournalMutation.mutate(journalId);
    }
  };

  // Get all unique tags from journals
  const allTags = [...new Set(journals?.flatMap(j => j.tags) || [])];

  // Filter journals based on search and tags
  const filteredJournals = journals?.filter(journal => {
    const matchesSearch = !searchTerm || 
      journal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      journal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => journal.tags.includes(tag));

    return matchesSearch && matchesTags;
  }) || [];

  const handleSaveJournal = (bodyCipher: string, title: string, tags: string[]) => {
    saveJournalMutation.mutate({ bodyCipher, title, tags });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Header 
        title="Encrypted Journal" 
        subtitle="Your private, secure space for reflection and insights"
      />
      
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* New Entry Section */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <EncryptedEditor
              onSave={handleSaveJournal}
              userId={user?.id || ""}
            />
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search entries by title or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                  data-testid="input-search-journals"
                />
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTags([]);
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Filter by tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (selectedTags.includes(tag)) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        data-testid={`badge-tag-${tag}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries */}
        <div className="space-y-4">
          {filteredJournals.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-book-open text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No entries found</h3>
                <p className="text-muted-foreground">
                  {journals?.length === 0 
                    ? "Start writing your first journal entry above."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredJournals.map((journal) => (
              <Card key={journal.id} className="bg-card border-border" data-testid={`card-journal-${journal.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1" data-testid={`text-journal-title-${journal.id}`}>
                        {journal.title || "Untitled Entry"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(journal.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-lock text-primary text-sm"></i>
                      <span className="text-xs text-muted-foreground">Encrypted</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {journal.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {journal.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decrypted Content */}
                  {expandedEntry === journal.id && decryptedContents[journal.id] && (
                    <div className="mb-4 p-4 bg-accent rounded-lg">
                      <div className="prose prose-sm max-w-none text-foreground">
                        {decryptedContents[journal.id].content.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {journal.summary && (
                    <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <i className="fas fa-robot text-primary text-sm mt-0.5"></i>
                        <div>
                          <p className="text-xs text-primary font-medium mb-1">AI Summary</p>
                          <p className="text-sm text-foreground">{journal.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecryptEntry(journal)}
                      data-testid={`button-decrypt-${journal.id}`}
                    >
                      <i className={`fas ${expandedEntry === journal.id ? 'fa-eye-slash' : 'fa-eye'} mr-2`}></i>
                      {expandedEntry === journal.id ? 'Hide Content' : 'View Content'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(journal.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteJournalMutation.isPending}
                      data-testid={`button-delete-${journal.id}`}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Privacy Note */}
        <Card className="bg-destructive/10 border border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <i className="fas fa-shield-alt text-destructive text-xl mt-1"></i>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Privacy & Security</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Client-side encryption:</strong> Your journal entries are 
                    encrypted on your device before being sent to our servers. We never have access to your unencrypted content.
                  </p>
                  <p>
                    <strong className="text-foreground">Encryption key:</strong> Your encryption key is stored locally 
                    in your browser. If you clear your browser data or use a different device, you may lose access to 
                    previous entries.
                  </p>
                  <p>
                    <strong className="text-foreground">Crisis content:</strong> We use AI to detect crisis language 
                    for safety purposes, but crisis content is never stored permanently.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
