import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SUGGESTIONS = [
  "Quais peças servem na escavadeira XE215?",
  "Peças paradas há mais de 2 anos com maior valor",
  "Resumo geral do estoque",
  "Filtros compatíveis entre modelos diferentes",
  "Resumo de vendas recentes",
  "Peças com estoque crítico (menos de 5 unidades)",
];

const FOLLOW_UP_MAP: Record<string, string[]> = {
  "filtro": ["Qual o intervalo de troca recomendado?", "Tem kit de filtros para revisão completa?", "Quais modelos usam o mesmo filtro?"],
  "estoque": ["Quais peças estão com estoque zerado?", "Valor total do estoque parado?", "Top 10 peças mais caras em estoque"],
  "compatib": ["Peças intercambiáveis entre escavadeiras?", "Filtros universais para linha XCMG?", "Peças de motor Cummins compatíveis"],
  "venda": ["Qual o ticket médio das vendas?", "Clientes que mais compraram", "Vendas por status (orçamento vs faturado)"],
  "parad": ["Sugestão de descontos para desova", "Quais modelos têm mais peças paradas?", "Valor total do capital imobilizado"],
  default: ["Quais peças precisam reposição urgente?", "Resumo do catálogo por categoria", "Peças mais vendidas"],
};

function getFollowUps(content: string): string[] {
  const lower = content.toLowerCase();
  for (const [key, suggestions] of Object.entries(FOLLOW_UP_MAP)) {
    if (key !== "default" && lower.includes(key)) return suggestions;
  }
  return FOLLOW_UP_MAP.default;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Sou o **Assistente Técnico Lopes & Lopes**, especialista em peças XCMG.\n\nPosso ajudar com:\n- 🔍 **Buscar peças** por código, descrição ou modelo\n- 🔄 **Compatibilidade** entre máquinas\n- 📊 **Análise de estoque** e preços\n- 💰 **Vendas e clientes**\n- 🔧 **Consultoria técnica** sobre manutenção\n\n**Dica:** Quanto mais detalhes você fornecer (modelo da máquina, sistema, tipo de peça), mais precisa será minha resposta!\n\nComo posso ajudar?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, followUps]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Msg = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setFollowUps([]);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages.filter(m => m.content) }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > newMessages.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Generate follow-up suggestions based on response
      if (assistantSoFar) {
        setFollowUps(getFollowUps(assistantSoFar));
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      toast.error(e.message || "Erro ao conectar com o assistente");
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="assistant-markdown prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Initial Suggestions */}
            {showSuggestions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-left text-sm px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic Follow-up Suggestions */}
            {!isLoading && followUps.length > 0 && !showSuggestions && (
              <div className="flex flex-wrap gap-2 mt-2">
                {followUps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setFollowUps([]); send(s); }}
                    className="text-xs px-3 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-card p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre peças, compatibilidade, estoque, vendas..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
