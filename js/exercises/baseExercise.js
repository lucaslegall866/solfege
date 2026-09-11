export class BaseExercise {
  constructor() {
    this.sequence = [];
    this.currentIndex = 0;
    this.attempts = 0;
    this.mistakes = 0;
  }

  generate(params) {
    throw new Error("La méthode generate() doit être implémentée.");
  }

  validate(input) {
    throw new Error("La méthode validate() doit être implémentée.");
  }

  getScore() {
    if (this.attempts === 0) return 100;
    return Math.max(0, Math.round(((this.attempts - this.mistakes) / this.attempts) * 100));
  }

  isFinished() {
    return this.currentIndex >= this.sequence.length;
  }
}