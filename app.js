const qrcode = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const axios = require("axios");
const fs = require("fs");

const client = new Client({
  authStrategy: new LocalAuth(),
  // puppeteer: { headless: false },
});

client.initialize();

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("ready", () => {
  console.log("Client is ready!");
});

let cmdRes;
fs.readFile("cmdRes.json", (err, data) => {
  if (err) throw err;
  cmdRes = JSON.parse(data);
  console.log("cmdRes", cmdRes);
});

// calc
function calculate(input) {
  var f = {
    add: "+",
    sub: "-",
    div: "/",
    mlt: "*",
    mod: "%",
    exp: "^",
  };

  // Create array for Order of Operation and precedence
  f.ooo = [
    [[f.mlt], [f.div], [f.mod], [f.exp]],
    [[f.add], [f.sub]],
  ];

  input = input.replace(/[^0-9%^*\/()\-+.]/g, ""); // clean up unnecessary characters

  var output;
  for (var i = 0, n = f.ooo.length; i < n; i++) {
    // Regular Expression to look for operators between floating numbers or integers
    var re = new RegExp(
      "(\\d+\\.?\\d*)([\\" + f.ooo[i].join("\\") + "])(\\d+\\.?\\d*)"
    );
    re.lastIndex = 0; // take precautions and reset re starting pos

    // Loop while there is still calculation for level of precedence
    while (re.test(input)) {
      output = _calculate(RegExp.$1, RegExp.$2, RegExp.$3);
      if (isNaN(output) || !isFinite(output)) return output; // exit early if not a number
      input = input.replace(re, output);
    }
  }

  return output;

  function _calculate(a, op, b) {
    a = a * 1;
    b = b * 1;
    switch (op) {
      case f.add:
        return a + b;
        break;
      case f.sub:
        return a - b;
        break;
      case f.div:
        return a / b;
        break;
      case f.mlt:
        return a * b;
        break;
      case f.mod:
        return a % b;
        break;
      case f.exp:
        return Math.pow(a, b);
        break;
      default:
        null;
    }
  }
}

client.on("message", async (message) => {
  console.log(message);
  let chat = await message.getChat();
  chat.sendSeen();

  if (message.hasMedia) {
    const media = await message.downloadMedia();
    // do something with the media data here
  }

  //change the value in the in-memory object
  // content.val1 = 42;
  //Serialize as JSON and Write it to a file
  // fs.writeFileSync(filename, JSON.stringify(content));

  for (const [key, value] of Object.entries(cmdRes)) {
    if (message?.body.toLowerCase() == "!" + key) {
      message.reply(value);
      break;
    }
  }
  var msgFirst = message.body.substring(0, message.body.indexOf(" "));
  var msgNFirst = message.body.substring(message.body.indexOf(" ") + 1);

  if (msgFirst == "!calc") {
    var res = calculate(msgNFirst);
    message.reply(`result => ${res}`);
    return message.react("🔢");
  }

  if (msgFirst == "!wikipedia") {
    axios
      .get(
        `https://id.wikipedia.org/w/api.php?action=query&format=json&list=search&formatversion=latest&srsearch=${msgNFirst}&srlimit=1&srprop=snippet&origin=*`
      )
      .then(async (res) => {
        console.log("res", res.data);
        var desc = res.data.query.search[0].snippet;
        var url =
          "https://id.wikipedia.org/?curid=" + res.data.query.search[0].pageid;
        message.reply(`baca disini ${url}`);
      })
      .catch((err) => {
        console.log("Error: ", err.message);
      });
  }

  if (message.body.toLowerCase() == "!randomimg") {
    const media = await MessageMedia.fromUrl("https://picsum.photos/200/300", {
      unsafeMime: true,
    });
    client.sendMessage(message.from, media, {
      caption: "Random Image",
    });
  }

  if (message.body.toLowerCase() === "!hello") {
    message.reply("Hello bro");
  }

  if (message.body === "!info") {
    let info = client.info;
    client.sendMessage(
      msg.from,
      `
        *Connection info*
        User name: ${info.pushname}
        My number: ${info.wid.user}
        Platform: ${info.platform}
    `
    );
  }

  if (message.body.toLowerCase() === "!meme") {
    //get media from url
    const media = await MessageMedia.fromUrl(
      "https://user-images.githubusercontent.com/41937681/162612030-11575069-33c2-4df2-ab1b-3fb3cb06f4cf.png"
    );

    //replying with media
    client.sendMessage(message.from, media, {
      caption: "meme",
    });
  }

  if (msgFirst.toLowerCase() === "!ygopro") {
    axios
      .get(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(
          msgNFirst
        )}`
      )
      .then(async (res) => {
        if (res.data.error) {
          message.reply(
            "No card matching your query was found in the database."
          );
        } else {
          const media = await MessageMedia.fromUrl(
            res.data.data[0].card_images[0].image_url
          );
          client.sendMessage(message.from, media, {
            caption: `Name : ${res.data.data[0].name}\nType : ${res.data.data[0].type}\nDesc : ${res.data.data[0].desc}
            `,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
  message.react("👍");
});
