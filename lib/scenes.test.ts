import { splitIntoScenes } from "./scenes";

describe("splitIntoScenes", () => {
  it("trims narration and skips blank lines", () => {
    const scenes = splitIntoScenes(["  First scene  ", "", "  Second scene"]);

    expect(scenes).toHaveLength(2);
    expect(scenes[0]).toMatchObject({
      id: 1,
      title: "Sahne 1",
      narration: "First scene",
    });
    expect(scenes[1].id).toBe(2);
  });

  it("returns no scenes for an empty script", () => {
    expect(splitIntoScenes([" ", ""])).toEqual([]);
  });

  it("estimates a minimum duration and limits visual prompts", () => {
    const [shortScene, longScene] = splitIntoScenes([
      "One short sentence.",
      "word ".repeat(250),
    ]);

    expect(shortScene.duration).toBe(3);
    expect(longScene.visualPrompt).toHaveLength(900);
  });
});
