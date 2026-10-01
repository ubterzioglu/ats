declare module 'turndown' {
  interface Options {
    headingStyle?: 'atx' | 'setext';
    hr?: string;
    bulletListMarker?: string;
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: string;
    emDelimiter?: string;
    strongDelimiter?: string;
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
  }
  class TurndownService {
    constructor(options?: Options);
    turndown(html: string | HTMLElement): string;
    use(plugin: unknown): this;
    addRule(key: string, rule: unknown): this;
  }
  export = TurndownService;
}

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: Record<string, unknown>;
  }
  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    save(): Promise<void>;
    outputPdf(): Promise<Blob>;
    toPdf(): Html2PdfInstance;
    toImg(): Html2PdfInstance;
    toCanvas(): Html2PdfInstance;
    toContainer(): Html2PdfInstance;
    output(type: string, options?: unknown): Promise<unknown>;
  }
  function html2pdf(): Html2PdfInstance;
  export = html2pdf;
}
