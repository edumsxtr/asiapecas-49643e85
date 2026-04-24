export type Lang = "pt" | "en" | "es";

const t = {
  // Header
  "header.parts": { pt: "Peças", en: "Parts", es: "Repuestos" },
  "header.howItWorks": { pt: "Como Funciona", en: "How It Works", es: "Cómo Funciona" },
  "header.faq": { pt: "Dúvidas", en: "FAQ", es: "Preguntas" },
  "header.contact": { pt: "Solicitar Atendimento", en: "Request Support", es: "Solicitar Atención" },
  "header.subtitle": { pt: "Peças Originais XCMG", en: "Original XCMG Parts", es: "Repuestos Originales XCMG" },

  // Hero
  "hero.title": { pt: "Peças Originais", en: "Original Parts", es: "Repuestos Originales" },
  "hero.subtitle": { pt: "Distribuidor autorizado — Brasil, Venezuela, Guiana", en: "Authorized distributor — Brazil, Venezuela, Guyana", es: "Distribuidor autorizado — Brasil, Venezuela, Guyana" },
  "hero.search": { pt: "Buscar peça por código, descrição ou modelo de máquina...", en: "Search part by code, description or machine model...", es: "Buscar repuesto por código, descripción o modelo de máquina..." },
  "hero.stats": { pt: "peças disponíveis em estoque", en: "parts available in stock", es: "repuestos disponibles en stock" },
  "cat.mineracao": { pt: "Mineração", en: "Mining", es: "Minería" },
  "cat.linha_amarela": { pt: "Linha Amarela", en: "Construction", es: "Línea Amarilla" },
  "cat.perfuratriz": { pt: "Perfuratriz", en: "Drilling", es: "Perforadora" },
  "cat.guindaste": { pt: "Guindaste", en: "Crane", es: "Grúa" },
  "cat.caminhao_eletrico": { pt: "Caminhão Elétrico", en: "Electric Truck", es: "Camión Eléctrico" },

  // How it works
  "how.title": { pt: "Como Funciona", en: "How It Works", es: "Cómo Funciona" },
  "how.step1.title": { pt: "Busque a Peça", en: "Search the Part", es: "Busque el Repuesto" },
  "how.step1.desc": { pt: "Pesquise por código, descrição ou modelo de máquina", en: "Search by code, description or machine model", es: "Busque por código, descripción o modelo de máquina" },
  "how.step2.title": { pt: "Monte seu Pedido", en: "Build Your Order", es: "Arme su Pedido" },
  "how.step2.desc": { pt: "Adicione as peças desejadas ao carrinho de cotação", en: "Add desired parts to the quote cart", es: "Agregue los repuestos deseados al carrito de cotización" },
  "how.step3.title": { pt: "Receba sua Cotação", en: "Get Your Quote", es: "Reciba su Cotización" },
  "how.step3.desc": { pt: "Envie o pedido e nossa equipe responde em até 24h", en: "Submit the order and our team responds within 24h", es: "Envíe el pedido y nuestro equipo responde en 24h" },

  // Catalog filters
  "filter.title": { pt: "Filtros", en: "Filters", es: "Filtros" },
  "filter.manufacturer": { pt: "Fabricante", en: "Manufacturer", es: "Fabricante" },
  "filter.allManufacturers": { pt: "Todos os fabricantes", en: "All manufacturers", es: "Todos los fabricantes" },
  "filter.model": { pt: "Modelo de Máquina", en: "Machine Model", es: "Modelo de Máquina" },
  "filter.allModels": { pt: "Todos os modelos", en: "All models", es: "Todos los modelos" },
  "filter.availability": { pt: "Disponibilidade", en: "Availability", es: "Disponibilidad" },
  "filter.all": { pt: "Todos", en: "All", es: "Todos" },
  "filter.readyToShip": { pt: "Pronta Entrega", en: "Ready to Ship", es: "Entrega Inmediata" },
  "filter.onDemand": { pt: "Sob Consulta", en: "On Demand", es: "Bajo Consulta" },
  "filter.clear": { pt: "Limpar Filtros", en: "Clear Filters", es: "Limpiar Filtros" },
  "filter.activeFilters": { pt: "filtros ativos", en: "active filters", es: "filtros activos" },
  "filter.partCategory": { pt: "Tipo de Peça", en: "Part Type", es: "Tipo de Repuesto" },
  "filter.allCategories": { pt: "Todas as categorias", en: "All categories", es: "Todas las categorías" },

  // Part categories
  "pcat.Filtros": { pt: "Filtros", en: "Filters", es: "Filtros" },
  "pcat.Vedações e Retentores": { pt: "Vedações e Retentores", en: "Seals & Retainers", es: "Sellos y Retenes" },
  "pcat.Motor e Componentes": { pt: "Motor e Componentes", en: "Engine & Components", es: "Motor y Componentes" },
  "pcat.Sistema Hidráulico": { pt: "Sistema Hidráulico", en: "Hydraulic System", es: "Sistema Hidráulico" },
  "pcat.Sistema Elétrico": { pt: "Sistema Elétrico", en: "Electrical System", es: "Sistema Eléctrico" },
  "pcat.Estrutural e Chassi": { pt: "Estrutural e Chassi", en: "Structure & Chassis", es: "Estructura y Chasis" },
  "pcat.Transmissão": { pt: "Transmissão", en: "Transmission", es: "Transmisión" },
  "pcat.Freios": { pt: "Freios", en: "Brakes", es: "Frenos" },
  "pcat.Refrigeração": { pt: "Refrigeração", en: "Cooling", es: "Refrigeración" },
  "pcat.Rolamentos e Buchas": { pt: "Rolamentos e Buchas", en: "Bearings & Bushings", es: "Rodamientos y Bujes" },
  "pcat.Acessórios e Outros": { pt: "Acessórios e Outros", en: "Accessories & Other", es: "Accesorios y Otros" },

  // Sort
  "sort.label": { pt: "Ordenar por", en: "Sort by", es: "Ordenar por" },
  "sort.relevance": { pt: "Relevância", en: "Relevance", es: "Relevancia" },
  "sort.stockDesc": { pt: "Maior estoque", en: "Highest stock", es: "Mayor stock" },
  "sort.nameAsc": { pt: "Nome A-Z", en: "Name A-Z", es: "Nombre A-Z" },
  "sort.newest": { pt: "Mais recentes", en: "Newest", es: "Más recientes" },
  "sort.priceAsc": { pt: "Menor preço", en: "Lowest price", es: "Menor precio" },
  "sort.priceDesc": { pt: "Maior preço", en: "Highest price", es: "Mayor precio" },

  // Catalog
  "catalog.found": { pt: "peças encontradas", en: "parts found", es: "repuestos encontrados" },
  "catalog.searching": { pt: "Buscando peças...", en: "Searching parts...", es: "Buscando repuestos..." },
  "catalog.page": { pt: "Página", en: "Page", es: "Página" },
  "catalog.of": { pt: "de", en: "of", es: "de" },
  "catalog.prev": { pt: "Anterior", en: "Previous", es: "Anterior" },
  "catalog.next": { pt: "Próxima", en: "Next", es: "Siguiente" },

  // Part card
  "part.details": { pt: "Detalhes", en: "Details", es: "Detalles" },
  "part.quote": { pt: "Cotar", en: "Quote", es: "Cotizar" },
  "part.added": { pt: "Adicionado", en: "Added", es: "Agregado" },
  "part.unavailable": { pt: "Indisponível", en: "Unavailable", es: "No disponible" },
  "part.units": { pt: "un.", en: "units", es: "uds." },
  "part.noModel": { pt: "Modelo não especificado", en: "Model not specified", es: "Modelo no especificado" },
  "part.readyToShip": { pt: "Pronta Entrega", en: "Ready to Ship", es: "Entrega Inmediata" },
  "part.lastUnits": { pt: "Últimas unidades!", en: "Last units!", es: "¡Últimas unidades!" },
  "part.aiVerified": { pt: "Verificado por IA", en: "AI Verified", es: "Verificado por IA" },
  "part.priceOnRequest": { pt: "Cotação sob consulta", en: "Price on request", es: "Precio bajo consulta" },
  "part.onPromotion": { pt: "Em promoção", en: "On promotion", es: "En promoción" },
  "part.availability": { pt: "Disponibilidade", en: "Availability", es: "Disponibilidad" },

  // Part detail
  "detail.techDesc": { pt: "Descrição Técnica", en: "Technical Description", es: "Descripción Técnica" },
  "detail.function": { pt: "Função Provável", en: "Probable Function", es: "Función Probable" },
  "detail.compatible": { pt: "Máquinas Compatíveis", en: "Compatible Machines", es: "Máquinas Compatibles" },
  "detail.specs": { pt: "Especificações", en: "Specifications", es: "Especificaciones" },
  "detail.similar": { pt: "Peças Similares", en: "Similar Parts", es: "Repuestos Similares" },
  "detail.addToQuote": { pt: "Adicionar à Cotação", en: "Add to Quote", es: "Agregar a Cotización" },
  "detail.alreadyAdded": { pt: "Já adicionado à cotação", en: "Already added to quote", es: "Ya agregado a cotización" },
  "detail.available": { pt: "unidades disponíveis", en: "units available", es: "unidades disponibles" },
  "detail.model": { pt: "Modelo", en: "Model", es: "Modelo" },
  "detail.manufacturer": { pt: "Fabricante", en: "Manufacturer", es: "Fabricante" },
  "detail.aiResearch": { pt: "Pesquisa IA", en: "AI Research", es: "Investigación IA" },

  // Cart
  "cart.title": { pt: "Cotação", en: "Quote", es: "Cotización" },
  "cart.items": { pt: "itens", en: "items", es: "artículos" },
  "cart.empty": { pt: "Nenhum item adicionado. Busque peças e adicione à cotação.", en: "No items added. Search parts and add to quote.", es: "No hay artículos. Busque repuestos y agregue a la cotización." },
  "cart.submit": { pt: "Solicitar Cotação", en: "Request Quote", es: "Solicitar Cotización" },
  "cart.sending": { pt: "Enviando...", en: "Sending...", es: "Enviando..." },
  "cart.send": { pt: "Enviar Cotação", en: "Send Quote", es: "Enviar Cotización" },
  "cart.back": { pt: "Voltar", en: "Back", es: "Volver" },
  "cart.sent": { pt: "Cotação Enviada!", en: "Quote Sent!", es: "¡Cotización Enviada!" },
  "cart.sentDesc": { pt: "Nossa equipe entrará em contato em breve.", en: "Our team will contact you soon.", es: "Nuestro equipo le contactará pronto." },
  "cart.new": { pt: "Nova Cotação", en: "New Quote", es: "Nueva Cotización" },
  "cart.name": { pt: "Nome", en: "Name", es: "Nombre" },
  "cart.company": { pt: "Empresa", en: "Company", es: "Empresa" },
  "cart.email": { pt: "Email", en: "Email", es: "Email" },
  "cart.phone": { pt: "Telefone", en: "Phone", es: "Teléfono" },
  "cart.notes": { pt: "Observações", en: "Notes", es: "Observaciones" },
  "cart.error": { pt: "Preencha nome, email e adicione ao menos 1 peça", en: "Fill name, email and add at least 1 part", es: "Complete nombre, email y agregue al menos 1 repuesto" },
  "cart.errorSend": { pt: "Erro ao enviar cotação", en: "Error sending quote", es: "Error al enviar cotización" },

  // FAQ
  "faq.title": { pt: "Perguntas Frequentes", en: "Frequently Asked Questions", es: "Preguntas Frecuentes" },
  "faq.subtitle": { pt: "Tire suas dúvidas sobre peças, entregas e pagamentos", en: "Get answers about parts, deliveries and payments", es: "Resuelva sus dudas sobre repuestos, entregas y pagos" },
  "faq.specialist": { pt: "Fale com um Especialista", en: "Talk to a Specialist", es: "Hable con un Especialista" },
  "faq.q1": { pt: "Qual o prazo de entrega das peças?", en: "What is the delivery time?", es: "¿Cuál es el plazo de entrega?" },
  "faq.a1": { pt: "Para peças em estoque, o prazo de envio é de 1 a 3 dias úteis. Para peças sob encomenda, o prazo varia de 15 a 45 dias conforme a origem.", en: "For in-stock parts, shipping time is 1-3 business days. For made-to-order parts, lead time varies from 15-45 days depending on origin.", es: "Para repuestos en stock, el plazo de envío es de 1 a 3 días hábiles. Para repuestos bajo pedido, el plazo varía de 15 a 45 días según el origen." },
  "faq.q2": { pt: "As peças possuem garantia?", en: "Do parts have warranty?", es: "¿Los repuestos tienen garantía?" },
  "faq.a2": { pt: "Sim. Todas as peças originais XCMG possuem garantia de fábrica. O prazo de garantia varia conforme o tipo de peça e aplicação.", en: "Yes. All original XCMG parts have factory warranty. Warranty period varies by part type and application.", es: "Sí. Todos los repuestos originales XCMG tienen garantía de fábrica. El plazo de garantía varía según el tipo de repuesto y aplicación." },
  "faq.q3": { pt: "Como faço para rastrear meu pedido?", en: "How can I track my order?", es: "¿Cómo puedo rastrear mi pedido?" },
  "faq.a3": { pt: "Após a confirmação do pedido, você receberá um código de rastreamento por e-mail. Também é possível acompanhar pelo WhatsApp com nosso atendimento.", en: "After order confirmation, you'll receive a tracking code by email. You can also track via WhatsApp with our support team.", es: "Después de la confirmación del pedido, recibirá un código de rastreo por email. También puede seguirlo por WhatsApp con nuestro equipo." },
  "faq.q4": { pt: "Vocês atendem fora do Brasil?", en: "Do you serve outside Brazil?", es: "¿Atienden fuera de Brasil?" },
  "faq.a4": { pt: "Sim! Atendemos Venezuela, Guiana e outros países da América Latina. Entre em contato para cotação com frete internacional.", en: "Yes! We serve Venezuela, Guyana and other Latin American countries. Contact us for international shipping quotes.", es: "¡Sí! Atendemos Venezuela, Guyana y otros países de América Latina. Contáctenos para cotización con flete internacional." },
  "faq.q5": { pt: "Quais formas de pagamento são aceitas?", en: "What payment methods are accepted?", es: "¿Qué formas de pago aceptan?" },
  "faq.a5": { pt: "Aceitamos boleto bancário, transferência/PIX, e cartão de crédito (parcelamento sob consulta). Para exportação, trabalhamos com carta de crédito e TT.", en: "We accept bank slip, wire transfer/PIX, and credit card (installments upon request). For exports, we work with letter of credit and TT.", es: "Aceptamos transferencia bancaria, PIX y tarjeta de crédito (cuotas bajo consulta). Para exportación, trabajamos con carta de crédito y TT." },
  "faq.q6": { pt: "Como sei se a peça é compatível com minha máquina?", en: "How do I know if the part is compatible with my machine?", es: "¿Cómo sé si el repuesto es compatible con mi máquina?" },
  "faq.a6": { pt: "Nosso sistema possui pesquisa de compatibilidade por IA. Ao consultar uma peça, você verá os modelos compatíveis. Em caso de dúvida, fale com nossos especialistas.", en: "Our system has AI-powered compatibility search. When viewing a part, you'll see compatible models. If in doubt, talk to our specialists.", es: "Nuestro sistema tiene búsqueda de compatibilidad con IA. Al consultar un repuesto, verá los modelos compatibles. En caso de duda, hable con nuestros especialistas." },

  // Footer
  "footer.about": { pt: "Ásia Peças & Máquinas — Distribuidor autorizado de peças originais XCMG. Atuamos no Brasil, Venezuela e Guiana, fornecendo peças para mineração, construção, perfuração, guindastes e caminhões elétricos.", en: "Ásia Peças & Máquinas — Authorized distributor of original XCMG parts. We operate in Brazil, Venezuela and Guyana, supplying parts for mining, construction, drilling, cranes and electric trucks.", es: "Ásia Peças & Máquinas — Distribuidor autorizado de repuestos originales XCMG. Operamos en Brasil, Venezuela y Guyana, suministrando repuestos para minería, construcción, perforación, grúas y camiones eléctricos." },
  "footer.segments": { pt: "Segmentos", en: "Segments", es: "Segmentos" },
  "footer.contact": { pt: "Contato", en: "Contact", es: "Contacto" },
  "footer.rights": { pt: "Todos os direitos reservados", en: "All rights reserved", es: "Todos los derechos reservados" },
  "footer.mining": { pt: "Mineração", en: "Mining", es: "Minería" },
  "footer.construction": { pt: "Linha Amarela (Construção)", en: "Construction Equipment", es: "Línea Amarilla (Construcción)" },
  "footer.drilling": { pt: "Perfuratriz", en: "Drilling Rig", es: "Perforadora" },
  "footer.crane": { pt: "Guindaste", en: "Crane", es: "Grúa" },
  "footer.eTruck": { pt: "Caminhão Elétrico", en: "Electric Truck", es: "Camión Eléctrico" },

  // Chat
  "chat.greeting": { pt: "Olá! Sou o assistente da Ásia Peças & Máquinas. Como posso ajudar? Posso tirar dúvidas sobre peças, compatibilidade de máquinas e prazos.", en: "Hello! I'm the Ásia Peças & Máquinas assistant. How can I help? I can answer questions about parts, machine compatibility and lead times.", es: "¡Hola! Soy el asistente de Ásia Peças & Máquinas. ¿Cómo puedo ayudar? Puedo resolver dudas sobre repuestos, compatibilidad de máquinas y plazos." },
  "chat.placeholder": { pt: "Pergunte sobre peças, modelos...", en: "Ask about parts, models...", es: "Pregunte sobre repuestos, modelos..." },
  "chat.title": { pt: "Assistente Ásia Peças", en: "Ásia Peças Assistant", es: "Asistente Ásia Peças" },
  "chat.typing": { pt: "Digitando...", en: "Typing...", es: "Escribiendo..." },
  "chat.error": { pt: "Erro ao conectar. Tente novamente ou fale conosco pelo WhatsApp.", en: "Connection error. Try again or contact us via WhatsApp.", es: "Error de conexión. Intente de nuevo o contáctenos por WhatsApp." },
  "chat.noResponse": { pt: "Desculpe, não consegui processar sua pergunta. Tente novamente.", en: "Sorry, I couldn't process your question. Try again.", es: "Disculpe, no pude procesar su pregunta. Intente de nuevo." },
} as const;

export type TKey = keyof typeof t;

export function tr(key: TKey, lang: Lang): string {
  return t[key]?.[lang] ?? t[key]?.["pt"] ?? key;
}
