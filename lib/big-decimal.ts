export class BigDecimal {
  private value: number;

  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }

  toLocaleString(): string {
    return this.value.toLocaleString();
  }

  static from(value: number | string): BigDecimal {
    return new BigDecimal(value);
  }
} 