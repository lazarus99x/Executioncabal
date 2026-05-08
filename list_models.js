const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAUonYVKHBLOCKL6-WVJSOnk205exy0zYo",
});

(async () => {
  try {
    const req = await ai.models.list();
    let names = [];
    for await (const m of req) {
      names.push(m.name);
    }
    fs.writeFileSync("available_models.txt", names.join("\n"));
    console.log("Done writing models");
  } catch (err) {
    console.error(err);
  }
})();
