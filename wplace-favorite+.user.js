// ==UserScript==
// @name         Favorite+
// @namespace    https://github.com/allanf181
// @version      1.3.0
// @description  More favorite for wplace.live (with labels)
// @author       allanf181
// @license      MIT
// @match        *://wplace.live/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wplace.live
// @homepageURL  https://github.com/allanf181/wplace-favorite-plus
// @updateURL    https://github.com/allanf181/wplace-favorite-plus/raw/refs/heads/master/wplace-favorite+.user.js
// @downloadURL  https://github.com/allanf181/wplace-favorite-plus/raw/refs/heads/master/wplace-favorite+.user.js
// @require      https://unpkg.com/maplibre-gl@^5.6.2/dist/maplibre-gl.js
// @require      https://cdn.jsdelivr.net/npm/fuzzysort@3.1.0/fuzzysort.min.js
// @run-at       document-start
// ==/UserScript==

function waitForElement(selector) {
    return new Promise(resolve => {
        const observer = new MutationObserver(mutations => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

const markers = [];

function getOpacityFromZoom(zoom) {
    if (zoom >= 10.6) return 0.3;
    return 1.0;
}

function createMarker(coords, name) {
    const element = document.createElement("div");
    element.classList.add("text-yellow-400");
    element.classList.add("cursor-pointer");
    element.classList.add("z-20");
    element.classList.add("tooltip");
    element.setAttribute("data-tip", name);
    element.innerHTML = markerIcon;
    element.onclick = function(e) {
        map.flyTo({center: coords, zoom: Math.max(map.getZoom(), 15)}, {origin: "flyToFav"});
    }
    let marker = new maplibregl.Marker({element: element, opacity: getOpacityFromZoom(map.getZoom())})
        .setLngLat(coords.reverse())
        .addTo(map);
    markers.push(marker);
    return marker;
}

function loadMarkers() {
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    favorites.forEach(fav => {
        createMarker(fav.posObj.coords, fav.title);
    });
}

function hideMarkers() {
    markers.forEach(marker => {
        marker.getElement().classList.add("hidden");
    });
}

function showMarkers() {
    markers.forEach(marker => {
        marker.getElement().classList.remove("hidden");
    });
}

function pixelInfoToPos(pixelInfo) {
    return {
        coords: pixelInfo.center,
        pixel: pixelInfo.pixel,
        tile: pixelInfo.tile
    }
}

function addFavorite(title, posObj ) {
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    favorites.push({ title, posObj });
    localStorage.setItem("favorites", JSON.stringify(favorites));
    createMarker(posObj.coords, title);
}

function removeFavorite(posObj) {
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    favorites = favorites.filter(fav =>
        !(fav.posObj.pixel[0] === posObj.pixel[0] &&
        fav.posObj.pixel[1] === posObj.pixel[1] &&
        fav.posObj.tile[0] === posObj.tile[0] &&
        fav.posObj.tile[1] === posObj.tile[1])
    );
    localStorage.setItem("favorites", JSON.stringify(favorites));
    markers.find(marker => {
        let lngLat = marker.getLngLat();
        let latLng = [lngLat.lat, lngLat.lng];
        return latLng[0] === posObj.coords[0] && latLng[1] === posObj.coords[1];
    }).remove()
}

function findFavoriteByPos(posObj) {
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    return favorites.find(fav =>
        fav.posObj.pixel[0] === posObj.pixel[0] &&
        fav.posObj.pixel[1] === posObj.pixel[1] &&
        fav.posObj.tile[0] === posObj.tile[0] &&
        fav.posObj.tile[1] === posObj.tile[1]
    );
}

const markerIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
  <path fill="#000a" d="m183-51 79-338L-1-617l346-29 135-319 135 319 346 29-263 228 79 338-297-180L183-51Z"/>
  <path d="m293-203.08 49.62-212.54-164.93-142.84 217.23-18.85L480-777.69l85.08 200.38 217.23 18.85-164.93 142.84L667-203.08 480-315.92 293-203.08Z"/>
    <text font-family="Serif" font-size="526.36" font-weight="bold" id="svg_3" stroke-width="0" text-anchor="middle" x="750" xml:space="preserve" y="-650">+</text>
</svg>`

function getAllFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function renderFavoritesTable(favorites) {
    const tableBody = document.querySelector("#favorite-table-body");
    tableBody.innerHTML = "";

    favorites.forEach(fav => {
        let row = document.createElement("tr");

        row.innerHTML = `
                <td>${fav.title}</td>
                <td>Tile: (${fav.posObj.tile[0]}, ${fav.posObj.tile[1]})<br>Pixel: (${fav.posObj.pixel[0]}, ${fav.posObj.pixel[1]})<br>Coords: (${fav.posObj.coords[0].toFixed(5)}, ${fav.posObj.coords[1].toFixed(5)})</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-soft" data-coords='${JSON.stringify(fav.posObj.coords)}'>Fly</button>
                    <button class="btn btn-sm btn-error btn-soft" data-posobj='${JSON.stringify(fav.posObj)}'>Delete</button>
                </td>
            `;
        tableBody.appendChild(row);
    });

    tableBody.querySelectorAll("button.btn-primary").forEach(button => {
        button.onclick = function() {
            let coords = JSON.parse(this.getAttribute("data-coords"));
            map.flyTo({center: coords.reverse(), zoom: Math.max(map.getZoom(), 15)}, {origin: "flyToFav"});
            const modal = document.querySelector("#favorite-modal");
            modal.removeAttribute("open");
        }
    });

    tableBody.querySelectorAll("button.btn-error").forEach(button => {
        button.onclick = function() {
            let confirmDelete = confirm("Are you sure you want to delete this favorite?");
            if (!confirmDelete) return;
            let posObj = JSON.parse(this.getAttribute("data-posobj"));
            removeFavorite(posObj);

            const searchTerm = document.querySelector("#favorite-search").value;
            filterAndRenderFavorites(searchTerm);
        }
    });
}

function filterAndRenderFavorites(searchTerm) {
    const allFavorites = getAllFavorites();
    if (!searchTerm) {
        renderFavoritesTable(allFavorites);
        return;
    }

    const results = fuzzysort.go(searchTerm, allFavorites, {key: 'title'});
    const filteredFavorites = results.map(result => result.obj);
    renderFavoritesTable(filteredFavorites);
}

let map = null;

(async function() {
    const observer = new MutationObserver((mutations, observer) => {
        for (const mutation of mutations) {
            if(!map) {
                map = document.querySelector("div.absolute.bottom-3.right-3.z-30").childNodes[0].__click[3].v
                map.on('zoom', (e) => {
                    const currentZoom = map.getZoom();
                    let opacity = getOpacityFromZoom(currentZoom);
                    markers.forEach(marker => {
                        marker.setOpacity(opacity);
                    })
                });
                loadMarkers()
            }
            if (mutation.target.className !== "flex flex-col gap-4 items-center") {
                return;
            }
            const selector = mutation.target.querySelector("div.flex.flex-col.items-center.gap-3");
            if (selector === null) {
                hideMarkers()
            }else {
                showMarkers()
            }
            if (selector.querySelector("#favorite-list")) {
                return;
            }
            const element = document.createElement("button");
            selector.appendChild(element);
            element.outerHTML = `
            <button id="favorite-list" class="btn btn-square relative shadow-md" title="Favorite List" >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
					<path fill="#000a" d="m183-51 79-338L-1-617l346-29 135-319 135 319 346 29-263 228 79 338-297-180L183-51Z"></path>
					<path d="m293-203.08 49.62-212.54-164.93-142.84 217.23-18.85L480-777.69l85.08 200.38 217.23 18.85-164.93 142.84L667-203.08 480-315.92 293-203.08Z"></path>
				</svg>
            </button>
        `;
            const favoriteButton = document.querySelector("#favorite-list");

            favoriteButton.addEventListener("click", () => {
                const modal = document.querySelector("#favorite-modal");
                modal.setAttribute("open", "true");

                const searchInput = document.querySelector("#favorite-search");
                if (searchInput) searchInput.value = "";
                filterAndRenderFavorites("");
            });
        }
    });

    const leftButtons = await waitForElement("body div.absolute.right-2.top-2.z-30");
    observer.observe(leftButtons, { childList: true, subtree: true });
    let mainDiv = document.querySelector("body > div");

    const modalHTML = `
    <div id="favorite-modal" class="modal">
      <div class="modal-box w-11/12 max-w-4xl max-h-11/12">
        <div class="flex items-center gap-1">
            <svg class="size-6" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                <path d="m183-51 79-338L-1-617l346-29 135-319 135 319 346 29-263 228 79 338-297-180L183-51Z"></path>
                <path d="m293-203.08 49.62-212.54-164.93-142.84 217.23-18.85L480-777.69l85.08 200.38 217.23 18.85-164.93 142.84L667-203.08 480-315.92 293-203.08Z"></path>
            </svg>
            <h3 class="font-bold text-lg">Favorite List</h3>
        </div>
        <div class="modal-action absolute right-2 top-2">
          <button type="button" id="import-favorites" class="btn btn-sm btn-secondary btn-outline">Import
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
          <button type="button" id="export-favorites" class="btn btn-sm btn-secondary btn-outline">Export
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
          </button>
          <label for="favorite-modal" class="btn btn-sm btn-circle">✕</label>
        </div>

        <div class="my-4">
            <input type="text" id="favorite-search" placeholder="Type to search..." class="input input-bordered w-full" />
        </div>

        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Title</th>
                <th>Pos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="favorite-table-body">
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `;

    mainDiv.insertAdjacentHTML("beforeend", modalHTML);

    const searchInput = await waitForElement("#favorite-search");
    searchInput.addEventListener("input", (e) => {
        filterAndRenderFavorites(e.target.value);
    });

    const favoriteClose = await waitForElement("#favorite-modal label");
    favoriteClose.addEventListener("click", function() {
        const modal = document.querySelector("#favorite-modal");
        modal.removeAttribute("open");
    })
    const importButton = await waitForElement("#import-favorites");

    importButton.addEventListener("click", function() {
        let base64 = prompt("Paste your favorites base64 string here:");
        if (!base64) {
            alert("Input cannot be empty.");
            return;
        }
        try {
            let jsonString = atob(base64);
            let favorites = JSON.parse(jsonString);
            if (!Array.isArray(favorites)) {
                throw new Error("Invalid format");
            }
            for (const fav of favorites) {
                if (typeof fav.title !== "string" || typeof fav.posObj !== "object" || !Array.isArray(fav.posObj.coords) || !Array.isArray(fav.posObj.pixel) || !Array.isArray(fav.posObj.tile)) {
                    throw new Error("Invalid format");
                }
                if (fav.posObj.coords.length !== 2 || fav.posObj.pixel.length !== 2 || fav.posObj.tile.length !== 2) {
                    throw new Error("Invalid format");
                }
                if (typeof fav.posObj.coords[0] !== "number" || typeof fav.posObj.coords[1] !== "number" ||
                    typeof fav.posObj.pixel[0] !== "number" || typeof fav.posObj.pixel[1] !== "number" ||
                    typeof fav.posObj.tile[0] !== "number" || typeof fav.posObj.tile[1] !== "number") {
                    throw new Error("Invalid format");
                }
            }
            let confirmImport = confirm(`This will overwrite your current favorites with ${favorites.length} favorites. Are you sure?`);
            if (!confirmImport) return;
            localStorage.setItem("favorites", JSON.stringify(favorites));
            markers.forEach(marker => marker.remove());
            markers.length = 0;
            loadMarkers();

            const searchInput = document.querySelector("#favorite-search");
            if (searchInput) searchInput.value = "";
            filterAndRenderFavorites("");

            alert("Import successful.");
        } catch (e) {
            alert("Failed to import favorites: " + e.message);
        }
    });

    const exportButton = await waitForElement("#export-favorites");
    exportButton.addEventListener("click", function() {
        let favorites = localStorage.getItem("favorites") || "[]";
        let base64 = btoa(favorites);
        navigator.clipboard.writeText(base64).then(() => {
            alert("Favorites exported to clipboard.");
        }, () => {
            alert("Failed to copy to clipboard. Here is the base64 string:\n" + base64);
        });
    });

    let currentPixelInfo = null;

    const observer2 = new MutationObserver((mutations, observer) => {
        for (const mutation of mutations) {
            if(mutation.addedNodes.length > 0){
                if(mutation.addedNodes[0].className && mutation.addedNodes[0].className === "absolute bottom-0 left-0 z-50 w-full sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 md:max-w-lg"){
                    let element = mutation.addedNodes[0];
                    let favButton = element.querySelector("div.hide-scrollbar").querySelector("button.btn-soft");
                    let favPlusButtonHTML = `
                            <button id="favplusbutton" class="btn btn-primary btn-soft">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" class="size-4.5">
                                    <path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z">
                                    </path>
                                </svg>Fav+
                            </button>
                        `
                    favButton.insertAdjacentHTML("afterend", favPlusButtonHTML)
                    document.querySelector("#favplusbutton").onclick = function () {
                        if(!currentPixelInfo) {
                            alert("No position data available.");
                            return;
                        }
                        if(findFavoriteByPos(currentPixelInfo)){
                            removeFavorite(pixelInfoToPos(currentPixelInfo))
                            document.querySelector("#favplusbutton").classList.remove("text-yellow-400");
                        } else {
                            let title = prompt("Enter a title for this favorite:");
                            if (!title) {
                                alert("Title cannot be empty.");
                                return;
                            }
                            let posObj = pixelInfoToPos(currentPixelInfo);
                            addFavorite(title, posObj);
                            document.querySelector("#favplusbutton").classList.add("text-yellow-400");
                        }
                    }
                }
                if(mutation.addedNodes[0].className && mutation.addedNodes[0].className === "maplibregl-marker maplibregl-marker-anchor-center z-20"){
                    currentPixelInfo = document.querySelector("button[class='btn btn-sm btn-circle btn-soft']").__click[4].v;
                    if(findFavoriteByPos(currentPixelInfo)){
                        document.querySelector("#favplusbutton").classList.add("text-yellow-400");
                    } else {
                        document.querySelector("#favplusbutton").classList.remove("text-yellow-400");
                    }
                }
            }
        }
    });
    observer2.observe(mainDiv.querySelector("div[class*=svelte-]"), { childList: true, subtree: true });
})();