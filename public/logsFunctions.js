// Funzione per popolare la tabella con i dati del database
function popolaTabella() {
  fetch("/seeLogs")
    .then((response) => response.json())
    .then((data) => {
      const tbody = document.querySelector("#tabella-dati tbody");

      // Cancello eventuali dati precedenti nella tabella
      tbody.innerHTML = "";
      console.log(data);

      // Popolo la tabella con i dati ricevuti
      data.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td>${row.id === null ? "" : row.id}</td>
                <td>${row.environmentTI === null ? "" : row.environmentTI}</td>
                <td>${row.timestamp === null ? "" : row.timestamp}</td>
                <td>${row.objectID === null ? "" : row.objectID}</td>
                <td>${row.timeUsedMs === null ? "" : row.timeUsedMs}</td>
                <td>${row.recordsRead === null ? "" : row.recordsRead}</td>
                <td>${
                  row.recordsInserted === null ? "" : row.recordsInserted
                }</td>
                <td>${
                  row.recordsUpdated === null ? "" : row.recordsUpdated
                }</td>
                <td>${
                  row.recordsDeleted === null ? "" : row.recordsDeleted
                }</td>
            `;
        tbody.appendChild(tr);
      });
    })
    .catch((error) => {
      console.error("Errore durante il caricamento dei dati:", error);
    });
}

// Chiama la funzione per popolare la tabella quando la pagina viene caricata
window.onload = popolaTabella;

// Funzione che reindirizza alla pagina principale
function tornaAllaPaginaPrincipale() {
  window.location.href = "index.html";
}
