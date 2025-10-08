import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { encryptJournalEntry } from "@/lib/crypto";

interface EncryptedEditorProps {
  onSave?: (encryptedData: string, title: string, tags: string[]) => void;
  userId: string;
  className?: string;
}

export function EncryptedEditor({ onSave, userId, className }: EncryptedEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsEncrypting(true);
    
    try {
      const encryptedData = await encryptJournalEntry(content, title || "Untitled", userId);
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      await onSave?.(encryptedData, title || "Untitled", tagArray);
      
      // Clear the form
      setTitle("");
      setContent("");
      setTags("");
      
      toast({
        title: "Entry Saved",
        description: "Your journal entry has been encrypted and saved securely.",
      });
    } catch (error) {
      console.error('Encryption error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to encrypt and save your entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground" data-testid="text-journal-title">
          Quick Journal
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <i className="fas fa-lock"></i>
          <span>End-to-end encrypted</span>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Entry title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-input border-border"
          data-testid="input-journal-title"
        />

        <Textarea 
          className="w-full bg-input border-border rounded-lg p-4 text-foreground placeholder-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
          rows={6}
          placeholder="What's on your mind? Your thoughts are encrypted before leaving your device..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          data-testid="textarea-journal-content"
        />

        <Input
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="bg-input border-border"
          data-testid="input-journal-tags"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-accent"
              data-testid="button-add-tags"
            >
              <i className="fas fa-tag mr-1"></i>
              Add Tags
            </Button>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isEncrypting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-save-encrypted"
          >
            {isEncrypting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Encrypting...
              </>
            ) : (
              <>
                <i className="fas fa-lock mr-2"></i>
                Save Encrypted
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
