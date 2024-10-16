// Funzione per popolare la tabella con i dati del database
function popolaTabella() {
  fetch("/seeDataLakeEnvironment")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.querySelector("#tabella-dati tbody");

      // Cancella eventuali dati precedenti nella tabella
      tbody.innerHTML = "";

      // Popola la tabella con i dati ricevuti
      data.forEach((row) => {
        const activeYN = row.activeYN === 1 ? "1" : "0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.id === null ? "-" : row.id}</td>
          <td>${row.objectName === null ? "-" : row.objectName}</td>
          <td>${row.environmentName === null ? "-" : row.environmentName}</td>
          <td>${row.schedulation === null ? "-" : row.schedulation}</td>
          <td>
            <select id="activeYN-${row.id}" onchange="toggleSchedulation(${
          row.id
        })" disabled>
              <option value="1" ${activeYN === "1" ? "selected" : ""}>1</option>
              <option value="0" ${activeYN === "0" ? "selected" : ""}>0</option>
            </select>
          </td>
          <td>${row.lastID === null ? "-" : row.lastID}</td>
          <td>${row.lastUpdate === null ? "-" : row.lastUpdate}</td>
          <td>
            <input type="number" id="recordSchedulation-${row.id}" value="${
          row.recordSchedulation === null ? "" : row.recordSchedulation
        }" disabled oninput="validateSchedulation(${
          row.id
        })" style="text-align: center;" />
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Errore durante il caricamento dei dati:", error);
    });
}

// Funzione per abilitare la modifica della colonna Active YN e Record Schedulation
function abilitaModifica() {
  const selects = document.querySelectorAll("select[id^='activeYN-']");
  const inputs = document.querySelectorAll("input[id^='recordSchedulation-']");

  selects.forEach((select) => {
    select.disabled = false; // Abilita i select box per modificare Active YN
  });

  inputs.forEach((input) => {
    const id = input.id.split("-")[1];
    const activeYN = document.getElementById(`activeYN-${id}`).value;
    input.disabled = false; // Abilita sempre la modifica della schedulazione
  });

  // Mostra i bottoni SALVA e ANNULLA, nasconde il bottone Modifica
  document.getElementById("salva-btn").style.display = "inline-block";
  document.getElementById("annulla-btn").style.display = "inline-block";
  document.getElementById("modifica-btn").style.display = "none";
}

// Funzione per abilitare/disabilitare la colonna Record Schedulation in base al valore di Active YN
function toggleSchedulation(id) {
  const activeYNValue = document.getElementById(`activeYN-${id}`).value;
  const schedulationInput = document.getElementById(`recordSchedulation-${id}`);

  if (activeYNValue === "1") {
    schedulationInput.disabled = false; // Abilita la modifica se Active YN è 1
  } else {
    schedulationInput.disabled = false; // Disabilita la modifica se Active YN è 0
    schedulationInput.style.border = ""; // Rimuove il bordo rosso, se presente
  }
  validateSchedulation(id); // Verifica la validità dell'input
}

// Funzione per validare il campo Record Schedulation e abilitare/disabilitare il bottone SALVA
function validateSchedulation(id) {
  const schedulationInput = document.getElementById(`recordSchedulation-${id}`);
  const activeYNValue = document.getElementById(`activeYN-${id}`).value;
  const saveButton = document.getElementById("salva-btn");

  let isValid = true;

  if (activeYNValue === "1") {
    // Se Active YN è 1, Record Schedulation deve essere > 0 e deve essere un numero
    if (isNaN(schedulationInput.value) || schedulationInput.value <= 0) {
      schedulationInput.style.border = "2px solid red"; // Bordo rosso se non valido
      isValid = false;
    } else {
      schedulationInput.style.border = ""; // Rimuove il bordo rosso se valido
    }
  } else if (activeYNValue === "0") {
    // Se Active YN è 0, Record Schedulation può essere vuoto o > 0
    if (
      schedulationInput.value &&
      (isNaN(schedulationInput.value) || schedulationInput.value <= 0)
    ) {
      schedulationInput.style.border = "2px solid red"; // Bordo rosso se non valido
      isValid = false;
    } else {
      schedulationInput.style.border = ""; // Rimuove il bordo rosso se valido
    }
  }

  if (isValid) {
    checkAllValid(); // Verifica se tutti i campi sono validi per abilitare SALVA
  } else {
    saveButton.disabled = true; // Disabilita il bottone SALVA se non valido
  }
}

// Funzione per verificare se tutti i campi sono validi e abilitare SALVA
function checkAllValid() {
  const inputs = document.querySelectorAll("input[id^='recordSchedulation-']");
  const saveButton = document.getElementById("salva-btn");

  let allValid = true;

  inputs.forEach((input) => {
    const id = input.id.split("-")[1];
    const activeYNValue = document.getElementById(`activeYN-${id}`).value;

    if (activeYNValue === "1") {
      // Controlla che Record Schedulation sia > 0 se Active YN è 1
      if (isNaN(input.value) || input.value <= 0) {
        allValid = false;
      }
    } else if (activeYNValue === "0") {
      // Controlla che Record Schedulation sia vuoto o > 0 se Active YN è 0
      if (input.value && (isNaN(input.value) || input.value <= 0)) {
        allValid = false;
      }
    }
  });

  saveButton.disabled = !allValid; // Abilita/disabilita SALVA in base alla validità dei campi
}

// Funzione per salvare le modifiche nel database
function salvaModifiche() {
  const rows = document.querySelectorAll("#tabella-dati tbody tr");
  const modifiche = [];

  rows.forEach((row) => {
    const id = row.querySelector("td:first-child").textContent;
    const activeYN = document.getElementById(`activeYN-${id}`).value;
    const recordSchedulation = document.getElementById(
      `recordSchedulation-${id}`
    ).value;

    if (
      (activeYN === "1" && recordSchedulation > 0) ||
      (activeYN === "0" &&
        (recordSchedulation === "" || recordSchedulation > 0))
    ) {
      modifiche.push({ id, activeYN, recordSchedulation });
    } else {
      alert("Inserisci un valore numerico valido per Record Schedulation");
      return;
    }
  });

  // Invia i dati modificati al server per l'aggiornamento nel database
  fetch("/updateDataLakeEnvironment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(modifiche),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        popolaTabella(); // Ricarica la tabella con i dati aggiornati
      } else {
        alert("Errore durante il salvataggio delle modifiche");
      }

      // Ripristina i bottoni
      document.getElementById("salva-btn").style.display = "none";
      document.getElementById("annulla-btn").style.display = "none";
      document.getElementById("modifica-btn").style.display = "inline-block";
    })
    .catch((error) => {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore durante il salvataggio");
    });
}

// Funzione per annullare le modifiche e ricaricare la tabella
function annullaModifiche() {
  popolaTabella(); // Ricarica la tabella senza salvare le modifiche

  // Ripristina i bottoni
  document.getElementById("salva-btn").style.display = "none";
  document.getElementById("annulla-btn").style.display = "none";
  document.getElementById("modifica-btn").style.display = "inline-block";
}

// Chiama la funzione per popolare la tabella quando la pagina viene caricata
window.onload = popolaTabella;

// Funzione che reindirizza alla pagina principale
function tornaAllaPaginaPrincipale() {
  window.location.href = "index.html";
}
