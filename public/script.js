// Funzione che reindirizza alla pagina con la tabella dei log
function seeLogs() {
  window.location.href = "logs.html";
}

// Funzione che reindirizza alla pagina con la tabella del DataLakeEnvironment
function seeDataLakeEnvironment() {
  window.location.href = "dataLakeEnvironment.html";
}

// Funzione che reindirizza alla pagina con la tabella dei DataLake Objects
function seeDataLakeObjects() {
  window.location.href = "dataLakeObjects.html";
}

// Funzione che reindirizza alla pagina con la tabella dei Database target
function seeTargetDatabase() {
  window.location.href = "targetDatabase.html";
}

// Funzione che reindirizza alla pagina per aggiungere nuovi DataLake Objects
function addDataLakeObject() {
  window.location.href = "addDataLakeObject.html";
}

// Funzione per controllare l'estensione del file
document.getElementById("file").addEventListener("change", function () {
  const file = this.files[0];
  const uploadButton = document.getElementById("upload-button");

  if (file) {
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension === "ionapi") {
      uploadButton.disabled = false; // Abilita il bottone se l'estensione è corretta
    } else {
      uploadButton.disabled = true; // Disabilita il bottone se l'estensione non è corretta
    }
  } else {
    uploadButton.disabled = true; // Disabilita il bottone se non c'è alcun file selezionato
  }
});

// Funzione per caricare il file
async function uploadFile(event) {
  event.preventDefault();

  const formData = new FormData(document.getElementById("file-upload-form"));

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const fileContent = await response.text();
      document.getElementById("message").innerText = fileContent;
      document.getElementById("file-upload-form").reset();
      document.getElementById("upload-button").disabled = true;
    } else {
      document.getElementById("message").innerText =
        "Errore durante il caricamento del file.";
    }
  } catch (error) {
    document.getElementById("message").innerText =
      "Si è verificato un errore: " + error.message;
  }
}
