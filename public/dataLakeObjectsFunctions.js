// Funzione per popolare la tabella con i dati del database
function popolaTabella() {
  fetch("/seeDataLakeObjects")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.querySelector("#tabella-dati tbody");

      // Cancella eventuali dati precedenti nella tabella
      tbody.innerHTML = "";

      // Popola la tabella con i dati ricevuti
      data.forEach((row) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row.id}</td>
          <td>${row.objectName}</td>
          <td>${row.columns}</td>
          <td>${row.columnPrefix}</td>
          <td>${row.uniqueKey}</td>
          <td>${row.excludedColumn}</td>
          <td><button class="delete-button" onclick="eliminaRiga(${row.id})">Elimina</button></td>
        `;

        tbody.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Errore durante il caricamento dei dati:", error);
    });
}

// Funzione per eliminare una riga e aggiornare il database
function eliminaRiga(id) {
  if (confirm("Sei sicuro di voler eliminare questo record?")) {
    fetch("/eliminaDataLakeObject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Ricarica la tabella dopo l'eliminazione
          popolaTabella();
        } else {
          alert("Errore durante l'eliminazione del record");
        }
      })
      .catch((error) => {
        console.error("Errore durante l'eliminazione:", error);
        alert("Errore durante l'eliminazione del record");
      });
  }
}

// Chiama la funzione per popolare la tabella quando la pagina viene caricata
window.onload = popolaTabella;

// Funzione che reindirizza alla pagina principale
function tornaAllaPaginaPrincipale() {
  window.location.href = "index.html";
}
