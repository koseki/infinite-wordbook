import { Configuration, OpenAIApi } from "openai";
import { argv } from "process";
import fs from "fs-extra";
import path from "path";

class Main {
  async execute() {
    const args = argv.slice(2);
    const wordfile = args[0];
    const words = (await fs.readFile(wordfile, "utf-8")).split(/\n/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
    const pickup = await this.pickupWords(words);
    // console.log(pickup.join("\n"));
    // return;

    const promptFile = path.join(__dirname, '../prompts/en.txt');
    const prompt = await fs.readFile(promptFile, "utf-8") + pickup.join(", ");

    const result = await this.sendRequest(prompt);
    const sentence = result[0].text?.replace(/^.+?AI: /s, "").trim();
    console.log(sentence)
  }

  async sendRequest(prompt: string) {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [" Human:", " AI:"],
    });
    return completion.data.choices;
  }

  async pickupWords(words: string[]) {
    const pickup: string[] = [];
    const wordsNum = 3;
    for (let i = 0; i < wordsNum; i++) {
      const word = this.weightedRandomChoice(words, 2.0);
      if (! pickup.includes(word)) {
        pickup.push(word);
      } else if (wordsNum < words.length) {
        i--;
        continue;
      }
    }
    return pickup;
  }

  weightedRandomChoice<T>(elements: T[], ratio: number): T {
    const len = elements.length;
    const diff = (ratio - 1) / (len - 1);
    const totalWeight = this.sumOfArithmeticSequence(len, 1, diff);
    const randomNum = Math.random() * totalWeight;
    let weight = ratio;
    let lastWeight = ratio;
    for (let i = 0; i < elements.length; i++) {
      if (randomNum < weight) {
        return elements[i];
      }
      lastWeight -= diff;
      weight += lastWeight;
    }
    return elements[elements.length - 1];
  }

  sumOfArithmeticSequence(n: number, a1: number, d: number): number {
    return n * (2 * a1 + (n - 1) * d) / 2;
  }
}

(async () => {
    await (new Main()).execute();
})();