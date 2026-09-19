declare module "google-finance-quote" {
  export class Finance {
    constructor(options?: { from?: string; to?: string });
    setFrom(from: string): this;
    setTo(to: string): this;
    quote(amount?: number): Promise<{ success: boolean; rate: number }>;
  }
}
