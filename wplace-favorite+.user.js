// ==UserScript==
// @name         Favorite+
// @namespace    https://github.com/allanf181
// @version      1.0.4
// @description  More favorite for wplace.live (with labels)
// @author       allanf181
// @license      MIT
// @match        *://wplace.live/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wplace.live
// @homepageURL  https://github.com/allanf181/wplace-favorite-plus
// @updateURL    https://github.com/allanf181/wplace-favorite-plus/raw/refs/heads/master/wplace-favorite+.user.js
// @downloadURL  https://github.com/allanf181/wplace-favorite-plus/raw/refs/heads/master/wplace-favorite+.user.js
// @require      https://unpkg.com/maplibre-gl@^5.6.2/dist/maplibre-gl.js
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

function loadFavoritesTable() {
    const tableBody = document.querySelector("#favorite-table-body");
    tableBody.innerHTML = "";
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    favorites.forEach((fav, index) => {
        let row = document.createElement("tr");
        row.innerHTML = `
                <td>${fav.title}</td>
                <td>Tile: (${fav.posObj.tile[0]}, ${fav.posObj.tile[1]})<br>Pixel: (${fav.posObj.pixel[0]}, ${fav.posObj.pixel[1]})<br>Coords: (${fav.posObj.coords[0].toFixed(5)}, ${fav.posObj.coords[1].toFixed(5)})</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-soft" data-index="${index}">Fly</button>
                    <button class="btn btn-sm btn-error btn-soft" data-index="${index}">Delete</button>
                </td>
            `;
        tableBody.appendChild(row);
    });
    tableBody.querySelectorAll("button.btn-primary").forEach(button => {
        button.onclick = function() {
            let index = this.getAttribute("data-index");
            let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            let fav = favorites[index];
            map.flyTo({center: fav.posObj.coords.reverse(), zoom: Math.max(map.getZoom(), 15)}, {origin: "flyToFav"});
            const modal = document.querySelector("#favorite-modal");
            modal.removeAttribute("open");
        }
    });
    tableBody.querySelectorAll("button.btn-error").forEach(button => {
        button.onclick = function() {
            let confirmDelete = confirm("Are you sure you want to delete this favorite?");
            if (!confirmDelete) return;
            let index = this.getAttribute("data-index");
            let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
            let fav = favorites[index];
            removeFavorite(fav.posObj);
            loadFavoritesTable();
        }
    });
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

            favoriteClose.addEventListener("click", function() {
                const modal = document.querySelector("#favorite-modal");
                modal.removeAttribute("open");
            })
            favoriteButton.addEventListener("click", () => {
                const modal = document.querySelector("#favorite-modal");
                modal.setAttribute("open", "true");
                loadFavoritesTable()
            });
        }
    });
    const leftButtons = await waitForElement("body div.absolute.right-2.top-2.z-30");
    observer.observe(leftButtons, { childList: true, subtree: true });
    let mainDiv = document.querySelector("body > div");
    const modalHTML = `
    <div id="favorite-modal" class="modal">
      <div class="modal-box w-11/12 max-w-4xl max-h-11/12">
        <h3 class="font-bold text-lg">Favorite List</h3>
        <div class="modal-action">
          <label for="favorite-modal" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
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
    const favoriteClose = await waitForElement("#favorite-modal label");



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
