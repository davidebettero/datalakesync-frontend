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
            <select id="activeYN-${row.id}" disabled>
              <option value="1" ${activeYN === "1" ? "selected" : ""}>1</option>
              <option value="0" ${activeYN === "0" ? "selected" : ""}>0</option>
            </select>
          </td>
          <td>${row.lastID === null ? "-" : row.lastID}</td>
          <td>${row.lastUpdate === null ? "-" : row.lastUpdate}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Errore durante il caricamento dei dati:", error);
    });
}

// Funzione per abilitare la modifica della colonna Active YN
function abilitaModifica() {
  const selects = document.querySelectorAll("select[id^='activeYN-']");

  selects.forEach((select) => {
    select.disabled = false; // Abilita i select box per modificare Active YN
  });

  // Mostra i bottoni SALVA e ANNULLA, nasconde il bottone Modifica
  document.getElementById("salva-btn").style.display = "inline-block";
  document.getElementById("annulla-btn").style.display = "inline-block";
  document.getElementById("modifica-btn").style.display = "none";
}

// Funzione per salvare le modifiche nel database
function salvaModifiche() {
  const rows = document.querySelectorAll("#tabella-dati tbody tr");
  const modifiche = [];

  rows.forEach((row) => {
    const id = row.querySelector("td:first-child").textContent;
    const activeYN = document.getElementById(`activeYN-${id}`).value;

    modifiche.push({ id, activeYN });
  });

  fetch("/updateActiveYN", {
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
  // Ricarica la tabella senza salvare le modifiche
  popolaTabella();

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
