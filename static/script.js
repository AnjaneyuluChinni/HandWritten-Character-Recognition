
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");
const uploadedImage = document.getElementById("uploadedImage");

let drawing = false;

// Initialize the canvas with a white background
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Drawing functionality
canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
});
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
}

// Clear canvas with white background
function clearCanvas() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Resize and convert drawing to grayscale
function getGrayscaleCanvas() {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = 256;
    tempCanvas.height = 256;
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
    }

    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas.toDataURL("image/png");
}

async function recognizeDrawing() {
    const imageData = getGrayscaleCanvas();

    const response = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData })
    });

    const result = await response.json();
    document.getElementById("output").innerText = "Recognized Text: " + result.recognized_text;
}

// Resize uploaded image before recognition
fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;

        img.onload = function () {
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");

            tempCanvas.width = 256;
            tempCanvas.height = 256;
            tempCtx.fillStyle = "white";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

            uploadedImage.src = tempCanvas.toDataURL("image/png");
            uploadedImage.style.display = "block";
        };
    };
    reader.readAsDataURL(file);
});

async function uploadImage() {
    const file = fileInput.files[0];
    if (!file) return alert("Please upload an image");

    const reader = new FileReader();
    reader.onload = async function (e) {
        const base64Image = e.target.result;

        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Image })
        });

        const result = await response.json();
        document.getElementById("output").innerText = "Recognized Text: " + result.recognized_text;
    };

    reader.readAsDataURL(file);
}

