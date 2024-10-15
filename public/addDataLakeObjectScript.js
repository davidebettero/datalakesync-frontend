document
  .querySelectorAll("#objectName, #objectType, #database-select")
  .forEach((element) => {
    element.addEventListener("input", checkFormFields);
  });

// Funzione per caricare i database dal server
async function loadDatabases() {
  try {
    const response = await fetch("/seeTargetDatabase");
    if (!response.ok) throw new Error("Errore nel recupero dei database");

    const databases = await response.json();
    const databaseSelect = document.getElementById("database-select");
    databaseSelect.innerHTML =
      '<option value="">Seleziona un ambiente</option>';

    databases.forEach((db) => {
      const option = document.createElement("option");
      option.value = JSON.stringify(db);
      option.textContent = db.id;
      databaseSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Si è verificato un errore:", error);
  }
}

// Carica i database al caricamento della pagina
loadDatabases();

// Funzione per controllare i campi del form
function checkFormFields() {
  const objectName = document.getElementById("objectName").value.trim();
  const objectType = document.getElementById("objectType").value.trim();
  const selectedDatabase = document.getElementById("database-select").value;

  document.getElementById("fetch-columns-btn").disabled = !(
    objectName &&
    objectType &&
    selectedDatabase
  );
}

// Recupera le colonne e le visualizza come checkbox
document
  .getElementById("fetch-columns-btn")
  .addEventListener("click", async () => {
    const objectName = document.getElementById("objectName").value;
    const selectedDatabase = JSON.parse(
      document.getElementById("database-select").value
    );

    const columnsContainer = document.getElementById("columns-container");
    const loadingMessage = document.getElementById("loading-message");

    loadingMessage.style.display = "block";
    columnsContainer.innerHTML = "";

    try {
      const query = new URLSearchParams({
        objectName: objectName,
        database: selectedDatabase.targetDatabase,
        schema: selectedDatabase.targetSchema,
        username: selectedDatabase.username,
        password: selectedDatabase.password,
        server: selectedDatabase.server,
      }).toString();

      const response = await fetch(`/getColumns?${query}`);

      if (!response.ok)
        throw new Error("Errore durante il recupero delle colonne");
      const columns = await response.json();
      displayColumnsAsCheckboxes(columns);
    } catch (error) {
      document.getElementById(
        "message"
      ).textContent = `Si è verificato un errore: ${error.message}`;
    } finally {
      loadingMessage.style.display = "none";
    }
  });

document
  .getElementById("add-object-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const objectName = document.getElementById("objectName").value.trim();
    const objectType = document.getElementById("objectType").value.trim();
    const selectedDatabase = JSON.parse(
      document.getElementById("database-select").value
    );
    const selectedColumns = [
      ...document.querySelectorAll('input[name="columns"]:checked'),
    ].map((cb) => cb.value);

    if (selectedColumns.length === 0) {
      alert("Seleziona almeno una colonna");
      return;
    }

    try {
      const response = await fetch("/addDataLakeObject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectName,
          objectType,
          selectedColumns,
          database: selectedDatabase.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Mostra un alert con il messaggio di successo
        alert(`DataLake Object aggiunto con successo!`);

        // Ricarica la pagina dopo che l'utente clicca "OK" nell'alert
        location.reload();
      } else {
        // Mostra un alert con il messaggio di errore
        alert(`Errore: ${result.message}`);
      }
    } catch (error) {
      alert(`Si è verificato un errore: ${error.message}`);
    }
  });

// Funzione per mostrare le colonne come checkbox
function displayColumnsAsCheckboxes(columns) {
  const columnsContainer = document.getElementById("columns-container");
  columnsContainer.innerHTML = columns
    .map(
      (column) => `
    <div>
      <input type="checkbox" name="columns" value="${column.name}" />
      <label>${column.name}</label>
    </div>
  `
    )
    .join("");

  const checkboxes = document.querySelectorAll('input[name="columns"]');
  const submitButton = document.getElementById("submit-btn");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      submitButton.disabled = ![...checkboxes].some(
        (checkbox) => checkbox.checked
      );
    });
  });
}
