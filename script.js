const SUPABASE_URL = "https://hctcybdymmqoxyhtgday.supabase.co";
const SUPABASE_KEY = "sb_publishable_E6NrKs0BnsE1lP8TzXN-FQ_j5XwWl2p";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);





supabaseClient.storage
    .from("ascension-images")
    .list("", { limit: 1 })
    .then(({ data, error }) => {
        console.log("TEST BUCKET :", data);
        console.log("ERREUR BUCKET :", error);
    });

// ================================
// CALCUL DE LA CLASSE
// ================================

function getClass(points) {
    if (points >= 300) return "S";
    if (points >= 200) return "A";
    if (points >= 150) return "B";
    if (points >= 100) return "C";
    if (points >= 50) return "D";
    return "E";
}
function getClassBadge(points) {

    const className = getClass(points);

    const medals = {
        S: "🥇",
        A: "🥈",
        B: "🥉",
        C: "",
        D: "",
        E: ""
    };

    return `
        <span class="class-badge class-${className}">
            <span class="class-medal">${medals[className]}</span>
            <span class="class-label">[${className}]</span>
        </span>
    `;
}


// ================================
// AFFICHAGE DU CLASSEMENT
// ================================

async function loadRanking() {

    const rankingList = document.getElementById("ranking-list");

    if (!rankingList) return;

    const { data: members, error: membersError } =
        await supabaseClient
            .from("members")
            .select("*")
            .order("points", { ascending: false });

    if (membersError) {
        console.error("Erreur :", membersError);
        return;
    }

    const { data: memberTitles, error: titlesError } =
        await supabaseClient
            .from("member_titles")
            .select(`
                member_id,
                title_id,
                titles (
                    id,
                    name
                )
            `);

    if (titlesError) {
        console.error("Erreur chargement titres :", titlesError);
        return;
    }

    rankingList.innerHTML = "";

    members.forEach((member, index) => {

        const memberElement = document.createElement("div");

        memberElement.classList.add("ranking-member");

        const titles = memberTitles.filter(
            memberTitle => memberTitle.member_id === member.id
        );

        if (titles.length > 0) {
            memberElement.classList.add("has-title");
        }

        memberElement.addEventListener("click", () => {
            openMemberModal(member);
        });

        memberElement.innerHTML = `
            <span class="ranking-position">
                #${index + 1}
            </span>

            <div class="ranking-member-main">

                <span class="ranking-name">
                    ${member.username}
                </span>

                <div class="ranking-titles">
                    ${
                        titles.length > 0
                            ? titles.map(memberTitle => `
                                <span class="ranking-title ${
    memberTitle.titles.name === "Chasseur de Classe S"
        ? "chasseur"
        : memberTitle.titles.name === "Survivant"
            ? "survivant"
            : memberTitle.titles.name === "Conquérant"
                ? "conquerant"
                : memberTitle.titles.name === "Roi du Dessin"
                    ? "roi-dessin"
                    : ""
}">
    ${
        memberTitle.titles.name === "Chasseur de Classe S"
            ? "🏹"
            : memberTitle.titles.name === "Survivant"
                ? "💚"
                : memberTitle.titles.name === "Conquérant"
                    ? "🛡️"
                    : memberTitle.titles.name === "Roi du Dessin"
                        ? "💎"
                        : ""
    }

    ${memberTitle.titles.name}
</span>
                            `).join("")
                            : ""
                    }
                </div>

            </div>

            <div class="ranking-class">
    ${getClassBadge(member.points)}
</div>

            <span class="ranking-points">
                ${member.points} PT
            </span>
        `;

        rankingList.appendChild(memberElement);
    });
}

loadRanking();




function openMemberModal(member) {

    const modal = document.getElementById("member-modal");

    if (!modal) return;



    const memberCard =
    document.getElementById("member-card");

if (memberCard) {
    memberCard.classList.remove(
        "member-class-E",
        "member-class-D",
        "member-class-C",
        "member-class-B",
        "member-class-A",
        "member-class-S"
    );

    memberCard.classList.add(
        `member-class-${getClass(member.points)}`
    );
}





    document.getElementById("modal-username").textContent =
        member.username;

    document.getElementById("modal-class").textContent =
        getClass(member.points);

    document.getElementById("modal-points").textContent =
        `${member.points} PT`;

    document.getElementById("modal-wins").textContent =
        "0";

    document.getElementById("modal-losses").textContent =
        "0";
const instagramLink =
    document.getElementById("modal-instagram");

if (instagramLink) {
    if (member.instagram_url) {
        instagramLink.href = member.instagram_url;
        instagramLink.style.display = "inline";
    } else {
        instagramLink.style.display = "none";
    }
}

    const historyContainer =
        document.getElementById("modal-history");

    if (historyContainer) {
        historyContainer.innerHTML = "Chargement...";
    }

    modal.classList.add("active");

loadMemberStats(member);
loadMemberDrawings(member);

}


async function loadMemberDrawings(member) {

    const drawingsContainer =
        document.getElementById("modal-drawings");

    if (!drawingsContainer) return;

    drawingsContainer.innerHTML = "Chargement...";

    const { data: drawings, error } =
        await supabaseClient
            .from("member_drawings")
            .select("image_url, display_order")
            .eq("member_id", member.id)
            .order("display_order", { ascending: true });

    if (error) {

        console.error(
            "Erreur chargement dessins :",
            error
        );

        drawingsContainer.textContent =
            "Impossible de charger les dessins.";

        return;
    }

    drawingsContainer.innerHTML = "";

    if (!drawings || drawings.length === 0) {

        drawingsContainer.textContent =
            "Aucun dessin enregistré.";

        return;
    }

    drawings.forEach((drawing, index) => {

        const image = document.createElement("img");

        image.src = drawing.image_url;

        image.alt =
            `Dessin ${index + 1} de ${member.username}`;

        image.classList.add("modal-drawing");

        drawingsContainer.appendChild(image);
    });
}

async function loadMemberStats(member) {

    const { data, error } = await supabaseClient
        .from("duel_participants")
        .select(`
            duel_id,
            placement,
            points_change,
            duels (
                id,
                format,
                theme,
                date_duel
            )
        `)
        .eq("member_id", member.id);

    if (error) {
        console.error("Erreur statistiques :", error);
        return;
    }

    let wins = 0;
    let losses = 0;

    data.forEach(participation => {

        if (participation.points_change > 0) {
            wins++;
        }

        if (participation.points_change < 0) {
            losses++;
        }

    });

    document.getElementById("modal-wins").textContent = wins;
    document.getElementById("modal-losses").textContent = losses;

    const historyContainer =
    document.getElementById("modal-history");

if (!historyContainer) return;

historyContainer.innerHTML = "";

if (data.length === 0) {
    historyContainer.textContent =
        "Aucun duel enregistré.";
    return;
}

const duelIds = data.map(
    participation => participation.duel_id
);

const { data: allParticipants, error: participantsError } =
    await supabaseClient
        .from("duel_participants")
        .select("duel_id, member_id, team, placement, points_change")
        .in("duel_id", duelIds);

if (participantsError) {
    console.error(
        "Erreur historique :",
        participantsError
    );
    return;
}

const memberIds = [
    ...new Set(
        allParticipants.map(
            participant => participant.member_id
        )
    )
];

const { data: members, error: membersError } =
    await supabaseClient
        .from("members")
        .select("id, username, instagram_url")
        .in("id", memberIds);

if (membersError) {
    console.error(
        "Erreur noms des membres :",
        membersError
    );
    return;
}

const memberNames = {};

members.forEach(otherMember => {
    memberNames[otherMember.id] =
        otherMember.username;
});


data.forEach(participation => {

    const duel = participation.duels;

    if (!duel) return;

    const duelParticipants =
        allParticipants.filter(
            participant =>
                participant.duel_id === participation.duel_id
        );

    const opponents =
        duelParticipants
            .filter(
                participant =>
                    participant.member_id !== member.id
            )
            .map(
                participant =>
                    memberNames[participant.member_id]
            );

    const historyItem =
        document.createElement("div");

    historyItem.classList.add("history-item");

    const result =
        participation.placement === 1
            ? "🏆 Victoire"
            : "❌ Défaite";

    const points =
        participation.points_change > 0
            ? `+${participation.points_change}`
            : `${participation.points_change}`;

    const date =
        new Date(duel.date_duel).toLocaleDateString("fr-FR");

    historyItem.innerHTML = `
        <strong>${date}</strong>

        <span>
            ${duel.format}
        </span>

        <span>
            vs ${opponents.join(", ")}
        </span>

        <span>
            ${result}
        </span>

        <span>
            ${points} PT
        </span>

        ${
            duel.theme
                ? `<span>Thème : ${duel.theme}</span>`
                : ""
        }
    `;

    historyContainer.appendChild(historyItem);
});


}


const closeModal = document.getElementById("close-modal");
const memberModal = document.getElementById("member-modal");

if (closeModal && memberModal) {
    closeModal.addEventListener("click", () => {
        memberModal.classList.remove("active");
    });
}
    





if (memberModal) {
    memberModal.addEventListener("click", (event) => {

        if (event.target.id === "member-modal") {
            memberModal.classList.remove("active");
        }

    });
}



// ================================
// ADMIN — AFFICHAGE DES MEMBRES
// ================================

async function loadAdminMembers() {

    const membersList = document.getElementById("members-list");

    if (!membersList) return;

    const { data: members, error: membersError } =
        await supabaseClient
            .from("members")
            .select("*")
            .order("points", { ascending: false });

    if (membersError) {
        console.error("Erreur chargement membres :", membersError);
        membersList.innerHTML =
            "<p>Impossible de charger les membres.</p>";
        return;
    }

    const { data: memberTitles, error: titlesError } =
        await supabaseClient
            .from("member_titles")
            .select(`
                id,
                member_id,
                title_id,
                titles (
                    id,
                    name
                )
            `);

    if (titlesError) {
        console.error("Erreur chargement titres des membres :", titlesError);
        return;
    }

    membersList.innerHTML = "";

    members.forEach(member => {

        const memberElement = document.createElement("div");

        memberElement.classList.add("admin-member");

        const titles = memberTitles.filter(
            memberTitle => memberTitle.member_id === member.id
        );

        if (titles.length > 0) {
            memberElement.classList.add("has-title");
        }

        memberElement.innerHTML = `
            <div class="admin-member-main">

                <span class="admin-member-name">
                    ${member.username}
                </span>

                <span class="admin-member-class">
    ${getClassBadge(member.points)}
</span>

                <span class="admin-member-points">
                    ${member.points} PT
                </span>

                <div class="admin-member-titles">
                    ${
                        titles.length > 0
                            ? titles.map(memberTitle => `
                                <span class="admin-member-title ${
    memberTitle.titles.name === "Chasseur de Classe S"
        ? "chasseur"
        : memberTitle.titles.name === "Survivant"
            ? "survivant"
            : memberTitle.titles.name === "Conquérant"
                ? "conquerant"
                : memberTitle.titles.name === "Roi du Dessin"
                    ? "roi-dessin"
                    : ""
}">
    ${
        memberTitle.titles.name === "Chasseur de Classe S"
            ? "🏹"
            : memberTitle.titles.name === "Survivant"
                ? "💚"
                : memberTitle.titles.name === "Conquérant"
                    ? "🛡️"
                    : memberTitle.titles.name === "Roi du Dessin"
                        ? "💎"
                        : ""
    }

    ${memberTitle.titles.name}
</span>
                            `).join("")
                            : ""
                    }
                </div>

            </div>

            <div class="admin-member-actions">

                <button class="edit-member-btn">
                    Modifier
                </button>

                <button class="delete-member-btn">
                    Supprimer
                </button>

            </div>
        `;

        membersList.appendChild(memberElement);

        const editBtn =
            memberElement.querySelector(".edit-member-btn");

        const deleteBtn =
            memberElement.querySelector(".delete-member-btn");

        editBtn.addEventListener("click", () => {
            editMember(member);
        });

        deleteBtn.addEventListener("click", () => {
            deleteMember(member);
        });
    });
}

loadAdminMembers();


// ================================
// ADMIN — AJOUTER UN MEMBRE
// ================================

const addMemberBtn = document.getElementById("add-member-btn");
const addMemberForm = document.getElementById("add-member-form");
const saveMemberBtn = document.getElementById("save-member-btn");
const cancelMemberBtn = document.getElementById("cancel-member-btn");

if (addMemberBtn) {

    addMemberBtn.addEventListener("click", () => {
        addMemberForm.classList.add("active");
    });

}

if (cancelMemberBtn) {

    cancelMemberBtn.addEventListener("click", () => {

        addMemberForm.classList.remove("active");

        document.getElementById("new-member-username").value = "";
        document.getElementById("new-member-points").value = "";

    });

}

if (saveMemberBtn) {

    saveMemberBtn.addEventListener("click", async () => {

        const username =
            document.getElementById("new-member-username").value.trim();

        const points =
            Number(document.getElementById("new-member-points").value);

        if (!username) {
            alert("Entre un pseudo.");
            return;
        }

        if (points < 0 || Number.isNaN(points)) {
            alert("Entre un nombre de points valide.");
            return;
        }

        const { error } = await supabaseClient
            .from("members")
            .insert({
                username: username,
                points: points
            });

        if (error) {
            console.error("Erreur ajout membre :", error);
            alert("Impossible d'ajouter le membre.");
            return;
        }

        addMemberForm.style.display = "none";

        document.getElementById("new-member-username").value = "";
        document.getElementById("new-member-points").value = "";

        loadAdminMembers();

    });

}

const membersToggle =
    document.getElementById("members-toggle");

const membersModule =
    document.getElementById("members-module");

if (membersToggle && membersModule) {

    membersToggle.addEventListener("click", () => {

        membersModule.classList.toggle("active");

    });

}

// ================================
// ADMIN — MODIFIER UN MEMBRE
// ================================

let editingMember = null;
let editingDrawings = [];


async function editMember(member) {

    editingMember = member;

    document.getElementById("edit-member-username").value =
        member.username || "";

    document.getElementById("edit-member-points").value =
        member.points ?? 0;

    document.getElementById("edit-member-instagram").value =
        member.instagram_url || "";

    editingDrawings = [];

    const { data, error } = await supabaseClient
        .from("member_drawings")
        .select("*")
        .eq("member_id", member.id)
        .order("display_order", { ascending: true });

    if (error) {
        console.error("Erreur chargement dessins :", error);
        alert("Impossible de charger les dessins.");
        return;
    }

    editingDrawings = data || [];

    renderEditingDrawings();

    document
        .getElementById("edit-member-modal")
        .classList.add("active");
}

function renderEditingDrawings() {

    const container = document.getElementById("edit-member-drawings");

    container.innerHTML = "";

    editingDrawings.forEach((drawing, index) => {

        const slot = document.createElement("div");
        slot.className = "drawing-slot";

        slot.innerHTML = `
            <div class="drawing-preview">
                <img src="${drawing.image_url}" alt="Dessin ${index + 1}">
            </div>

            <div class="drawing-buttons">

                <button
                    type="button"
                    class="replace-drawing-btn"
                    onclick="replaceDrawing(${index})"
                >
                    Remplacer
                </button>

                <button
                    type="button"
                    class="delete-drawing-btn"
                    onclick="removeDrawing(${index})"
                >
                    Supprimer
                </button>

            </div>
        `;

        container.appendChild(slot);
    });

    if (editingDrawings.length < 3) {

        const addSlot = document.createElement("div");
        addSlot.className = "drawing-slot";

        addSlot.innerHTML = `
            <div class="drawing-preview">
                <div class="drawing-empty">
                    + Ajouter
                </div>
            </div>
        `;

        container.appendChild(addSlot);
    }
}


function replaceDrawing(index) {

    if (index < 0 || index >= editingDrawings.length) {
        return;
    }

    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", async () => {

        const file = input.files[0];

        if (!file) return;

        editingDrawings[index].newFile = file;
        editingDrawings[index].replace = true;

        renderEditingDrawings();
    });

    input.click();
}


function addDrawing() {

    if (editingDrawings.length >= 3) {
        alert("Un artiste peut avoir maximum 3 dessins.");
        return;
    }

    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.addEventListener("change", async () => {

        const file = input.files[0];

        if (!file) return;

        editingDrawings.push({
            newFile: file,
            image_url: null,
            display_order: editingDrawings.length + 1
        });

        renderEditingDrawings();
    });

    input.click();
}


async function removeDrawing(index) {

    if (index < 0 || index >= editingDrawings.length) {
        return;
    }

    const drawing = editingDrawings[index];

    // Si le dessin existe déjà dans le Storage
    if (drawing.image_url) {

        const oldPath =
            getStoragePathFromUrl(drawing.image_url);

        if (oldPath) {

            const { error } =
                await supabaseClient
                    .storage
                    .from("ascension-images")
                    .remove([oldPath]);

            if (error) {
                console.error(
                    "Erreur suppression image :",
                    error
                );

                alert("Impossible de supprimer le dessin.");
                return;
            }
        }
    }

    // Retirer le dessin de la liste
    editingDrawings.splice(index, 1);

    // Recalculer l'ordre
    editingDrawings.forEach((drawing, i) => {
        drawing.display_order = i + 1;
    });

    renderEditingDrawings();
}

document
    .getElementById("add-drawing-btn")
    .addEventListener("click", addDrawing);



async function compressImage(file) {

    const maxSize = 3 * 1024 * 1024; // 3 Mo

    if (file.size <= maxSize) {
        return file;
    }

    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.src = objectUrl;

    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    let width = image.width;
    let height = image.height;

    const maxDimension = 3000;

    if (width > maxDimension || height > maxDimension) {

        const ratio = Math.min(
            maxDimension / width,
            maxDimension / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    URL.revokeObjectURL(objectUrl);

    let quality = 0.9;

    while (quality >= 0.3) {

        const blob = await new Promise(resolve => {

            canvas.toBlob(
                resolve,
                "image/webp",
                quality
            );

        });

        if (blob && blob.size <= maxSize) {

            return new File(
                [blob],
                "drawing.webp",
                {
                    type: "image/webp"
                }
            );
        }

        quality -= 0.1;
    }

    // Si l'image est encore trop lourde,
    // on réduit progressivement sa résolution.

    let currentWidth = width;
    let currentHeight = height;

    while (true) {

        currentWidth = Math.round(currentWidth * 0.8);
        currentHeight = Math.round(currentHeight * 0.8);

        canvas.width = currentWidth;
        canvas.height = currentHeight;

        context.drawImage(
            image,
            0,
            0,
            currentWidth,
            currentHeight
        );

        const blob = await new Promise(resolve => {

            canvas.toBlob(
                resolve,
                "image/webp",
                0.7
            );

        });

        if (blob && blob.size <= maxSize) {

            return new File(
                [blob],
                "drawing.webp",
                {
                    type: "image/webp"
                }
            );
        }
    }
}


// ================================
// ADMIN — SUPPRIMER UN MEMBRE
// ================================

async function deleteMember(member) {

    const confirmation = confirm(
        `Supprimer ${member.username} définitivement ?`
    );

    if (!confirmation) return;

    const { error } = await supabaseClient
        .from("members")
        .delete()
        .eq("id", member.id);

    if (error) {
        console.error("Erreur suppression :", error);
        alert("Impossible de supprimer le membre.");
        return;
    }

    loadAdminMembers();
    loadRanking();
}

async function uploadDrawing(file, memberId, drawingId) {

    console.log("FICHIER À UPLOADER :", file);
    console.log("TAILLE :", file?.size);
    console.log("TYPE :", file?.type);

    const filePath =
        `members/${memberId}/test-${Date.now()}.webp`;

    console.log("CHEMIN :", filePath);

    const { data, error } = await supabaseClient
        .storage
        .from("ascension-images")
        .upload(filePath, file, {
            contentType: file.type || "image/webp",
            upsert: false
        });

    console.log("UPLOAD DATA :", data);
    console.log("UPLOAD ERROR :", error);

    if (error) {
        throw error;
    }

    const { data: publicUrlData } =
        supabaseClient
            .storage
            .from("ascension-images")
            .getPublicUrl(filePath);

    console.log("URL :", publicUrlData.publicUrl);

    return {
        url: publicUrlData.publicUrl,
        path: filePath
    };
}


async function saveEditMember() {

    if (!editingMember) return;

    const usernameInput =
        document.getElementById("edit-member-username");

    const pointsInput =
        document.getElementById("edit-member-points");

    const instagramInput =
        document.getElementById("edit-member-instagram");

    const newUsername = usernameInput.value.trim();
    const newPoints = Number(pointsInput.value);
    const instagramUrl = instagramInput.value.trim();

    if (!newUsername) {
        alert("Le pseudo ne peut pas être vide.");
        return;
    }

    if (Number.isNaN(newPoints) || newPoints < 0) {
        alert("Nombre de points invalide.");
        return;
    }

    const saveButton =
        document.getElementById("save-edit-member-btn");

    saveButton.disabled = true;
    saveButton.textContent = "Enregistrement...";

    try {

        /* ========================= */
        /* 1. MODIFIER LE MEMBRE     */
        /* ========================= */

        const { error: memberError } = await supabaseClient
            .from("members")
            .update({
                username: newUsername,
                points: newPoints,
                instagram_url: instagramUrl || null
            })
            .eq("id", editingMember.id);

        if (memberError) {
            throw memberError;
        }


        /* ========================= */
        /* 2. TRAITER LES DESSINS     */
        /* ========================= */

        const finalDrawings = [];

        for (let i = 0; i < editingDrawings.length; i++) {

            const drawing = editingDrawings[i];

            /*
             * Nouveau dessin ou dessin remplacé
             */
            if (drawing.newFile) {

                const uploaded =
                    await uploadDrawing(
                        drawing.newFile,
                        editingMember.id,
                        i + 1
                    );

                /*
                 * Si on remplace un ancien dessin,
                 * on supprime l'ancien fichier du Storage.
                 */
                if (drawing.image_url) {

                    const oldPath =
                        getStoragePathFromUrl(
                            drawing.image_url
                        );

                    if (oldPath) {

                        await supabaseClient
                            .storage
                            .from("ascension-images")
                            .remove([oldPath]);
                    }
                }

                finalDrawings.push({
                    image_url: uploaded.url,
                    display_order: i + 1
                });

            } else {

                /*
                 * Dessin déjà existant
                 */
                finalDrawings.push({
                    image_url: drawing.image_url,
                    display_order: i + 1
                });
            }
        }


        /* ========================= */
        /* 3. SUPPRIMER LES ANCIENS  */
        /* ========================= */

        const { error: deleteError } = await supabaseClient
            .from("member_drawings")
            .delete()
            .eq("member_id", editingMember.id);

        if (deleteError) {
            throw deleteError;
        }


        /* ========================= */
        /* 4. RÉINSÉRER LES DESSINS   */
        /* ========================= */

        if (finalDrawings.length > 0) {

            const drawingsToInsert =
                finalDrawings.map(drawing => ({
                    member_id: editingMember.id,
                    image_url: drawing.image_url,
                    display_order: drawing.display_order
                }));

            const { error: insertError } =
                await supabaseClient
                    .from("member_drawings")
                    .insert(drawingsToInsert);

            if (insertError) {
                throw insertError;
            }
        }


        /* ========================= */
        /* 5. FERMER LA FENÊTRE       */
        /* ========================= */

        document
            .getElementById("edit-member-modal")
            .classList.remove("active");

        editingMember = null;
        editingDrawings = [];


        /* ========================= */
        /* 6. ACTUALISER L'ADMIN     */
        /* ========================= */

        loadAdminMembers();
        loadRanking();

        alert("Membre modifié avec succès.");

    } catch (error) {

        console.error(
            "Erreur enregistrement membre :",
            error
        );

        alert(
            "Une erreur est survenue pendant l'enregistrement."
        );

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Enregistrer";
    }
}

function getStoragePathFromUrl(url) {

    if (!url) return null;

    const marker =
        "/storage/v1/object/public/ascension-images/";

    const index = url.indexOf(marker);

    if (index === -1) {
        return null;
    }

    return decodeURIComponent(
        url.substring(index + marker.length)
    );
}

document
    .getElementById("save-edit-member-btn")
    .addEventListener("click", saveEditMember);

// ================================


function closeEditMemberModal() {

    document
        .getElementById("edit-member-modal")
        .classList.remove("active");

    editingMember = null;
    editingDrawings = [];
}


document
    .getElementById("cancel-edit-member-btn")
    .addEventListener("click", closeEditMemberModal);


document
    .getElementById("close-edit-member-btn")
    .addEventListener("click", closeEditMemberModal);

// ADMIN — PARTICIPANTS DU DUEL
// ================================

const duelFormat = document.getElementById("duel-format");
const duelParticipants = document.getElementById("duel-participants");

async function loadDuelParticipants() {

    if (!duelParticipants) return;

    const { data, error } = await supabaseClient
        .from("members")
        .select("id, username")
        .order("username", { ascending: true });

    if (error) {
        console.error("Erreur chargement participants :", error);
        return;
    }

    let numberOfParticipants = 2;

    if (duelFormat.value === "1v2") {
        numberOfParticipants = 3;
    }

    if (duelFormat.value === "2v2") {
        numberOfParticipants = 4;
    }

    if (duelFormat.value === "1v1v1") {
        numberOfParticipants = 3;
    }

    duelParticipants.innerHTML = "";

  

     for (let i = 0; i < numberOfParticipants; i++) {

    const row = document.createElement("div");

    row.classList.add("duel-participant-row");

    row.innerHTML = `
        <label>
            Participant ${i + 1}
        </label>

        <select class="duel-member-select">
            <option value="">Choisir un membre</option>
        </select>

        <select class="duel-team-select">
    <option value="1">Équipe 1</option>
    <option value="2">Équipe 2</option>
    <option value="3">Équipe 3</option>
</select>

        <select class="duel-result">
            <option value="">Résultat</option>
            <option value="win">Victoire</option>
            <option value="loss">Défaite</option>
        </select>

        <input
            type="number"
            class="duel-points-change"
            placeholder="Points"
        >
    `;

    const memberSelect =
        row.querySelector(".duel-member-select");

        const teamSelect =
    row.querySelector(".duel-team-select");

if (duelFormat.value === "1v1") {
    teamSelect.value = i === 0 ? "1" : "2";
}

if (duelFormat.value === "1v2") {
    teamSelect.value = i === 0 ? "1" : "2";
}

if (duelFormat.value === "2v2") {
    teamSelect.value = i < 2 ? "1" : "2";
}

if (duelFormat.value === "1v1v1") {
    teamSelect.value = String(i + 1);
}

    data.forEach(member => {

        const option = document.createElement("option");

        option.value = member.id;
        option.textContent = member.username;

        memberSelect.appendChild(option);
    });

    duelParticipants.appendChild(row);
}

    
}

if (duelFormat) {

    duelFormat.addEventListener("change", () => {
        loadDuelParticipants();
    });

    loadDuelParticipants();
}


// ================================
// ADMIN — ENREGISTRER UN DUEL
// ================================

const saveDuelBtn = document.getElementById("save-duel-btn");

if (saveDuelBtn) {

    saveDuelBtn.addEventListener("click", async () => {

        const dateDuel =
            document.getElementById("duel-date").value;

        const format =
            document.getElementById("duel-format").value;

        const theme =
            document.getElementById("duel-theme").value.trim();

        if (!dateDuel) {
            alert("Choisis une date.");
            return;
        }

        const selects =
    document.querySelectorAll(".duel-member-select");

const resultSelects =
    document.querySelectorAll(".duel-result");

const pointsInputs =
    document.querySelectorAll(".duel-points-change");

    const teamSelects =
    document.querySelectorAll(".duel-team-select");

const participants = [];

for (let i = 0; i < selects.length; i++) {

    const memberId = selects[i].value;
    const result = resultSelects[i].value;
    const pointsChange = Number(pointsInputs[i].value);

    if (!memberId) {
        alert(`Choisis le participant ${i + 1}.`);
        return;
    }

    if (
    participants.some(
        participant => participant.member_id === Number(memberId)
    )
) {
    alert("Un membre ne peut pas participer deux fois au même duel.");
    return;
}

    if (!result) {
        alert(`Choisis le résultat du participant ${i + 1}.`);
        return;
    }

    if (Number.isNaN(pointsChange)) {
        alert(`Entre les points du participant ${i + 1}.`);
        return;
    }

    participants.push({
    member_id: Number(memberId),
    team: Number(teamSelects[i].value),
    placement: result === "win" ? 1 : 2,
    points_change: pointsChange
});
}

        if (participants.length === 0) {
            alert("Choisis au moins un participant.");
            return;
        }

        const { data: duel, error: duelError } =
            await supabaseClient
                .from("duels")
                .insert({
                    format: format,
                    theme: theme || null,
                    date_duel: dateDuel
                })
                .select()
                .single();

        if (duelError) {
            console.error("Erreur création duel :", duelError);
            alert("Impossible d'enregistrer le duel.");
            return;
        }

        const duelParticipants = participants.map(participant => ({
    duel_id: duel.id,
    member_id: participant.member_id,
    team: participant.team,
    placement: participant.placement,
    points_change: participant.points_change
}));

        const { error: participantsError } =
            await supabaseClient
                .from("duel_participants")
                .insert(duelParticipants);

        if (participantsError) {
    console.error(
        "Erreur participants :",
        participantsError.message,
        participantsError.details,
        participantsError.hint,
        participantsError.code
    );

    alert("Le duel a été créé, mais les participants n'ont pas pu être enregistrés.");
    return;
}


for (const participant of participants) {

    const { data: member, error: memberError } =
        await supabaseClient
            .from("members")
            .select("points")
            .eq("id", participant.member_id)
            .single();

    if (memberError) {
        console.error(
            "Erreur récupération points :",
            memberError
        );
        continue;
    }

    const newPoints =
        member.points + participant.points_change;

    const { error: updateError } =
        await supabaseClient
            .from("members")
            .update({
                points: newPoints
            })
            .eq("id", participant.member_id);

    if (updateError) {
        console.error(
            "Erreur mise à jour points :",
            updateError
        );
    }
}


        await loadAdminMembers();
        await loadRanking();

        alert("Duel enregistré !");

    });

}

// ================================
// ADMIN — GESTION DES BADGES
// ================================

const badgesList = document.getElementById("badges-list");

async function loadBadgesAdmin() {

    if (!badgesList) return;

    const { data: badges, error: badgesError } =
        await supabaseClient
            .from("titles")
            .select("id, name, max_holders")
            .order("id", { ascending: true });

    if (badgesError) {
        console.error("Erreur chargement badges :", badgesError);
        return;
    }

    const { data: members, error: membersError } =
        await supabaseClient
            .from("members")
            .select("id, username")
            .order("username", { ascending: true });

    if (membersError) {
        console.error("Erreur chargement membres :", membersError);
        return;
    }

    badgesList.innerHTML = "";

    badges.forEach(badge => {

        const badgeElement = document.createElement("div");

        badgeElement.classList.add("admin-badge");

        badgeElement.innerHTML = `
            <h3>${badge.name}</h3>

            <select class="badge-member-select">
                <option value="">Choisir un membre</option>
            </select>

            <button class="add-badge-btn">
                Attribuer
            </button>

            <div class="badge-holders">
                Chargement...
            </div>
        `;

        badgesList.appendChild(badgeElement);

        const memberSelect =
            badgeElement.querySelector(".badge-member-select");

        const holdersContainer =
            badgeElement.querySelector(".badge-holders");

        members.forEach(member => {

            const option = document.createElement("option");

            option.value = member.id;
            option.textContent = member.username;

            memberSelect.appendChild(option);
        });

        loadBadgeHolders(
            badge.id,
            holdersContainer,
            members
        );

        const addButton =
            badgeElement.querySelector(".add-badge-btn");

        addButton.addEventListener("click", async () => {

            const memberId = memberSelect.value;

            if (!memberId) {
                alert("Choisis un membre.");
                return;
            }

            const { error } =
                await supabaseClient
                    .from("member_titles")
                    .insert({
                        member_id: Number(memberId),
                        title_id: badge.id
                    });

            if (error) {
                console.error(
                    "Erreur attribution badge :",
                    error
                );

                alert("Impossible d'attribuer le badge.");
                return;
            }

            memberSelect.value = "";

            loadBadgeHolders(
                badge.id,
                holdersContainer,
                members
            );
        });
    });
}


async function loadBadgeHolders(
    badgeId,
    container,
    members
) {

    const { data, error } =
        await supabaseClient
            .from("member_titles")
            .select("id, member_id, obtained_at")
            .eq("title_id", badgeId);

    if (error) {
        console.error(
            "Erreur chargement détenteurs :",
            error
        );
        return;
    }

    container.innerHTML = "";

    if (data.length === 0) {
        container.textContent = "Aucun détenteur.";
        return;
    }

    data.forEach(holder => {

        const member = members.find(
            member => member.id === holder.member_id
        );

        const holderElement =
            document.createElement("div");

        holderElement.classList.add("badge-holder");

        holderElement.innerHTML = `
            <span>
                ${member ? member.username : "Membre inconnu"}
            </span>

            <button class="remove-badge-btn">
                Retirer
            </button>
        `;

        container.appendChild(holderElement);

        const removeButton =
            holderElement.querySelector(".remove-badge-btn");

        removeButton.addEventListener("click", async () => {

            const { error } =
                await supabaseClient
                    .from("member_titles")
                    .delete()
                    .eq("id", holder.id);

            if (error) {
                console.error(
                    "Erreur retrait badge :",
                    error
                );

                alert("Impossible de retirer le badge.");
                return;
            }

            loadBadgeHolders(
                badgeId,
                container,
                members
            );
        });
    });
}

loadBadgesAdmin();





// ================================
// ADMIN — FENÊTRES DES MODULES
// ================================

const openDuelBtn =
    document.getElementById("open-duel-btn");

const closeDuelBtn =
    document.getElementById("close-duel-btn");

const duelFormModal =
    document.getElementById("duel-form-modal");


if (openDuelBtn && duelFormModal) {

    openDuelBtn.addEventListener("click", () => {
        duelFormModal.classList.add("active");
    });

}


if (closeDuelBtn && duelFormModal) {

    closeDuelBtn.addEventListener("click", () => {
        duelFormModal.classList.remove("active");
    });

}


const openTitlesBtn =
    document.getElementById("open-titles-btn");

const closeTitlesBtn =
    document.getElementById("close-titles-btn");

const titlesModal =
    document.getElementById("titles-modal");


if (openTitlesBtn && titlesModal) {

    openTitlesBtn.addEventListener("click", () => {
        titlesModal.classList.add("active");
    });

}


if (closeTitlesBtn && titlesModal) {

    closeTitlesBtn.addEventListener("click", () => {
        titlesModal.classList.remove("active");
    });

}