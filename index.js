const { writeFile } = require("fs");
const { join } = require("path");
const request = require("request");
const blend = require("@mapbox/blend");

const { generateUrl, promisify } = require("./lib/utils");

const argv = require("minimist")(process.argv.slice(2), {
  // it is easier to set default values in 'minimist' config
  default: {
    greeting: "Hello",
    who: "You",
    width: 400,
    height: 500,
    color: "Pink",
    size: 100,
  },
});

// 'request.get' and 'blend' accepts an error first callback, so we can convert it
// into a promise with Node's 'util.promisify'
const getRequest = promisify(request.get);
const blendPromise = promisify(blend);

const host = "https://cataas.com";
const path = "/cat";

async function start() {
  try {
    const input = takeInput();
    const baseImageUrl = generateBaseImageUrl(input);
    const textImageUrls = getTextImageUrls(baseImageUrl, input);
    const imageBinaries = await getImageBinaries(textImageUrls);
    const bindImageConfig = getBindImageConfig(input, "jpeg");
    const newImage = await bindImages(imageBinaries, bindImageConfig);

    saveImage(newImage);
  } catch (error) {
    console.error("An error occured >", error);
  }
}

function takeInput() {
  return argv;
}

function saveImage(imageBinary) {
  const fileOut = join(process.cwd(), `/cat-card.jpg`);
  writeFile(fileOut, imageBinary, "binary", (error) => {
    if (error) {
      throw new Error("Error while wring new image", error);
    }
  });
  console.log("The file was saved!");
}

async function bindImages(imageBinaries, config) {
  try {
    const buffers = imageBinaries.map((image, idx) => ({
      buffer: Buffer.from(image, "binary"),
      x: config.imagePositions[idx].x,
      y: config.imagePositions[idx].y,
    }));
    const newImage = await blendPromise(buffers, config.container);
    return newImage;
  } catch (error) {
    throw new Error("Error while binding images", error);
  }
}

function generateBaseImageUrl(input) {
  try {
    const urlConfig = {
      host,
      path,
      params: {
        width: input.width,
        height: input.height,
        color: input.color,
        size: input.size,
      },
    };
    return generateUrl(urlConfig);
  } catch (error) {
    throw new Error("Error while creating the base image url");
  }
}

function getTextImageUrls(baseImageUrl, input) {
  try {
    const textImageUrlOne = textImageUrl(baseImageUrl, input.greeting);
    const textImageUrlTwo = textImageUrl(baseImageUrl, input.who);

    return [textImageUrlOne, textImageUrlTwo];
  } catch (error) {
    throw error;
  }
}

async function getImageBinaries(imageUrls) {
  const imageBinaries = [];
  try {
    for (const url of imageUrls) {
      const body = await getImageBinary(url);
      imageBinaries.push(body);
    }
    return imageBinaries;
  } catch (error) {
    throw error;
  }
}

function textImageUrl(url, text) {
  url.pathname = `/cat/says/${text}`;
  return url.href;
}

function getBindImageConfig(input, imageFormat) {
  return {
    imagePositions: [
      {
        x: 0,
        y: 0,
      },
      {
        x: input.width,
        y: 0,
      },
    ],
    container: {
      width: input.width * 2,
      height: input.height,
      format: imageFormat,
    },
  };
}

async function getImageBinary(imageUrl) {
  try {
    const { body } = await getRequest({
      url: imageUrl,
      encoding: "binary",
    });
    return body;
  } catch (error) {
    throw new Error("Unable to get image binary");
  }
}

// Starts the application
start();
