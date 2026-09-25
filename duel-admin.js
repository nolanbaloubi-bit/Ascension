
const SUPABASE_URL =
    "https://hctcybdymmqoxyhtgday.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_E6NrKs0BnsE1lP8TzXN-FQ_j5XwWl2p";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==================================================
// VARIABLES
// ==================================================

let currentEvent = null;

let eventParticipants = [];

let eventMatches = [];

let allMembers = [];


// ==================================================
// CHARGEMENT DE L'ÉVÉNEMENT
// ==================================================

async function loadEvent() {

    const { data, error } =
        await supabaseClient
            .from("duel_events")
            .select("*")
            .order("created_at", {
                ascending: false
            })
            .limit(1)
            .maybeSingle();

    if (error) {

        console.error(
            "Erreur chargement événement :",
            error
        );

        return;
    }

    if (!data) {

        currentEvent = null;

        updateStatus();

        return;
    }

    currentEvent = data;

    document.getElementById(
        "event-name"
    ).value = data.name || "";

    document.getElementById(
        "event-theme"
    ).value = data.theme || "";

    document.getElementById(
        "event-stake"
    ).value = data.stake ?? 0;

    document.getElementById(
        "event-min-participants"
    ).value =
        data.min_participants ?? 2;

    document.getElementById(
        "event-status-select"
    ).value =
        data.status || "draft";

    document.getElementById(
        "save-event-btn"
    ).textContent =
        "Enregistrer les modifications";

    updateStatus();
}


// ==================================================
// STATUT DE L'ÉVÉNEMENT
// ==================================================

function updateStatus() {

    const status =
        document.getElementById(
            "event-status"
        );

    const select =
        document.getElementById(
            "event-status-select"
        );

    if (!status || !select) return;

    const labels = {

        draft:
            "Brouillon",

        active:
            "Actif",

        finished:
            "Terminé"

    };

    const value =
        select.value;

    status.textContent =
        labels[value] || "Inconnu";

    status.className =
        `status-badge status-${value}`;
}


// ==================================================
// SAUVEGARDER L'ÉVÉNEMENT
// ==================================================

async function saveEvent() {

    const name =
        document.getElementById(
            "event-name"
        ).value.trim();

    const theme =
        document.getElementById(
            "event-theme"
        ).value.trim();

    const stake =
        Number(
            document.getElementById(
                "event-stake"
            ).value
        );

    const minParticipants =
        Number(
            document.getElementById(
                "event-min-participants"
            ).value
        );

    const status =
        document.getElementById(
            "event-status-select"
        ).value;

    if (!name) {

        alert(
            "Le nom de l'événement est obligatoire."
        );

        return;
    }

    if (minParticipants < 2) {

        alert(
            "Le nombre minimum de participants doit être d'au moins 2."
        );

        return;
    }

    const eventData = {

        name:
            name,

        theme:
            theme || null,

        stake:
            stake || 0,

        min_participants:
            minParticipants,

        status:
            status

    };

    let result;

    if (currentEvent) {

        result =
            await supabaseClient
                .from("duel_events")
                .update(eventData)
                .eq(
                    "id",
                    currentEvent.id
                )
                .select()
                .single();

    } else {

        result =
            await supabaseClient
                .from("duel_events")
                .insert(eventData)
                .select()
                .single();

    }

    if (result.error) {

        console.error(
            "Erreur sauvegarde événement :",
            result.error
        );

        alert(
            "Impossible d'enregistrer l'événement."
        );

        return;
    }

    currentEvent =
        result.data;

    document.getElementById(
        "save-event-btn"
    ).textContent =
        "Enregistrer les modifications";

    updateStatus();

    await loadEventParticipants();

    alert(
        "Événement enregistré."
    );
}


// ==================================================
// CHARGER TOUS LES MEMBRES
// ==================================================

async function loadMembersForParticipantSelect() {

    const select =
        document.getElementById(
            "participant-select"
        );

    if (!select) return;

    const {
        data: members,
        error
    } =
        await supabaseClient
            .from("members")
            .select("id, username")
            .order(
                "username",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Erreur chargement membres :",
            error
        );

        return;
    }

    allMembers =
        members || [];

    select.innerHTML = `
        <option value="">
            Sélectionner un membre
        </option>
    `;

    allMembers.forEach(
        member => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                member.id;

            option.textContent =
                member.username;

            select.appendChild(
                option
            );

        }
    );
}


// ==================================================
// CHARGER LES PARTICIPANTS DE L'ÉVÉNEMENT
// ==================================================

async function loadEventParticipants() {

    if (!currentEvent) {

        eventParticipants = [];

        renderEventParticipants();

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "duel_event_participants"
            )
            .select(`
                id,
                member_id,
                created_at,
                members (
                    id,
                    username
                )
            `)
            .eq(
                "event_id",
                currentEvent.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Erreur chargement participants :",
            error
        );

        return;
    }

    eventParticipants =
        data || [];

    renderEventParticipants();

    if (
        matchFormatSelect &&
        matchFormatSelect.value
    ) {

        generateMatchParticipantFields();

    }

    await loadEventMatches();
}


// ==================================================
// AFFICHER LES PARTICIPANTS DE L'ÉVÉNEMENT
// ==================================================

function renderEventParticipants() {

    const container =
        document.getElementById(
            "participants-list"
        );

    if (!container) return;

    container.innerHTML = "";

    if (
        eventParticipants.length === 0
    ) {

        container.innerHTML =
            "<p>Aucun participant enregistré.</p>";

        return;
    }

    eventParticipants.forEach(
        participant => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "event-participant";

            item.innerHTML = `

                <span>
                    ${escapeHtml(
                        participant.members?.username ||
                        "Membre inconnu"
                    )}
                </span>

                <button
                    type="button"
                    class="remove-participant-btn"
                    data-id="${participant.id}"
                >
                    Supprimer
                </button>

            `;

            container.appendChild(
                item
            );

        }
    );

    container
        .querySelectorAll(
            ".remove-participant-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeEventParticipant(
                            button.dataset.id
                        );

                    }
                );

            }
        );
}


// ==================================================
// AJOUTER UN PARTICIPANT À L'ÉVÉNEMENT
// ==================================================

async function addEventParticipant() {

    if (!currentEvent) {

        alert(
            "Crée d'abord un événement."
        );

        return;
    }

    const select =
        document.getElementById(
            "participant-select"
        );

    const memberId =
        Number(
            select.value
        );

    if (!memberId) {

        alert(
            "Sélectionne un membre."
        );

        return;
    }

    const alreadyExists =
        eventParticipants.some(
            participant =>
                participant.member_id ===
                memberId
        );

    if (alreadyExists) {

        alert(
            "Ce membre participe déjà à l'événement."
        );

        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from(
                "duel_event_participants"
            )
            .insert({

                event_id:
                    currentEvent.id,

                member_id:
                    memberId

            });

    if (error) {

        console.error(
            "Erreur ajout participant :",
            error
        );

        alert(
            "Impossible d'ajouter le participant."
        );

        return;
    }

    select.value = "";

    await loadEventParticipants();
}


// ==================================================
// SUPPRIMER UN PARTICIPANT DE L'ÉVÉNEMENT
// ==================================================

async function removeEventParticipant(
    id
) {

    const {
        error
    } =
        await supabaseClient
            .from(
                "duel_event_participants"
            )
            .delete()
            .eq(
                "id",
                id
            );

    if (error) {

        console.error(
            "Erreur suppression participant :",
            error
        );

        alert(
            "Impossible de supprimer le participant."
        );

        return;
    }

    await loadEventParticipants();
}


// ==================================================
// FORMATS DES PETITS DUELS
// ==================================================

const matchFormats = {

    "1v1":
        [1, 1],

    "1v2":
        [1, 2],

    "1v1v1":
        [1, 1, 1],

    "2v2":
        [2, 2],

    "1v3":
        [1, 3],

    "2v3":
        [2, 3],

    "1v1v1v1":
        [1, 1, 1, 1]

};


// ==================================================
// ÉLÉMENTS DU FORMULAIRE PETIT DUEL
// ==================================================

const matchFormatSelect =
    document.getElementById(
        "match-format"
    );

const matchParticipantsContainer =
    document.getElementById(
        "match-participants-container"
    );


// ==================================================
// CHANGEMENT DE FORMAT
// ==================================================

matchFormatSelect?.addEventListener(
    "change",
    generateMatchParticipantFields
);


// ==================================================
// GÉNÉRER LES PARTICIPANTS
// ==================================================

function generateMatchParticipantFields() {

    if (
        !matchParticipantsContainer
    ) return;

    const format =
        matchFormatSelect.value;

    if (!format) {

        matchParticipantsContainer.innerHTML = `
            <p>
                Sélectionne d'abord un format.
            </p>
        `;

        return;
    }

    const teams =
        matchFormats[format];

    if (!teams) return;

    matchParticipantsContainer.innerHTML =
        "";

    teams.forEach(
        (teamSize, teamIndex) => {

            if (teams.length > 1) {

                const teamTitle =
                    document.createElement(
                        "h4"
                    );

                teamTitle.textContent =
                    `Équipe ${teamIndex + 1}`;

                matchParticipantsContainer
                    .appendChild(
                        teamTitle
                    );
            }

            for (
                let i = 0;
                i < teamSize;
                i++
            ) {

                const wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "match-participant-field";

                const label =
                    document.createElement(
                        "label"
                    );

                label.textContent =
                    `Participant ${i + 1}`;

                const select =
                    document.createElement(
                        "select"
                    );

                select.className =
                    "match-participant-select";

                select.dataset.team =
                    teamIndex + 1;

                const defaultOption =
                    document.createElement(
                        "option"
                    );

                defaultOption.value =
                    "";

                defaultOption.textContent =
                    "Sélectionner un participant";

                select.appendChild(
                    defaultOption
                );

                allMembers.forEach(
                    member => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            member.id;

                        option.textContent =
                            member.username;

                        select.appendChild(
                            option
                        );

                    }
                );

                wrapper.appendChild(
                    label
                );

                wrapper.appendChild(
                    select
                );

                matchParticipantsContainer
                    .appendChild(
                        wrapper
                    );
            }

        }
    );
}


// ==================================================
// CHARGER LES PETITS DUELS
// ==================================================

async function loadEventMatches() {

    if (!currentEvent) {

        eventMatches = [];

        renderEventMatches();

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .select(`
                id,
                format,
                theme,
                scheduled_at,
                status,
                winner_id,
                cancel_reason,
                created_at
            `)
            .eq(
                "event_id",
                currentEvent.id
            )
            .order(
                "scheduled_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Erreur chargement petits duels :",
            error
        );

        return;
    }

    eventMatches =
        data || [];

    await renderEventMatches();
}


// ==================================================
// AFFICHER LES PETITS DUELS
// ==================================================

async function renderEventMatches() {

    const container =
        document.getElementById(
            "matches-list"
        );

    if (!container) return;

    container.innerHTML = "";

    if (
        eventMatches.length === 0
    ) {

        container.innerHTML =
            "<p>Aucun petit duel enregistré.</p>";

        return;
    }

    for (
        const match of eventMatches
    ) {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "event-match";

        const {
            data: participants,
            error
        } =
            await supabaseClient
                .from(
                    "duel_event_match_participants"
                )
                .select(`
                    member_id,
                    team,
                    members (
                        username
                    )
                `)
                .eq(
                    "match_id",
                    match.id
                );

        if (error) {

            console.error(
                "Erreur chargement participants du petit duel :",
                error
            );
        }

        const teams = {};

        (participants || [])
            .forEach(
                participant => {

                    const team =
                        participant.team;

                    if (!teams[team]) {

                        teams[team] = [];

                    }

                    teams[team].push(
                        participant.members?.username ||
                        "Participant inconnu"
                    );

                }
            );

        const teamNames =
            Object.keys(teams)
                .sort(
                    (a, b) =>
                        Number(a) -
                        Number(b)
                )
                .map(
                    team =>
                        teams[team].join(
                            " + "
                        )
                );

        const participantsDisplay =
            teamNames.length > 1
                ? teamNames.join(
                    " VS "
                )
                : (
                    teamNames[0] ||
                    "Aucun participant"
                );

        const date =
            match.scheduled_at
                ? new Date(
                    match.scheduled_at
                ).toLocaleString(
                    "fr-FR"
                )
                : "Date non définie";

        const statusLabels = {

            pending:
                "En attente",

            active:
                "En cours",

            finished:
                "Terminé",

            cancelled:
                "Annulé"

        };

        const statusLabel =
            statusLabels[
                match.status
            ] ||
            match.status;

        let winnerName =
            "";

        if (match.winner_id) {

            const winner =
                allMembers.find(
                    member =>
                        Number(member.id) ===
                        Number(match.winner_id)
                );

            if (winner) {

                winnerName =
                    winner.username;

            }

        }

        item.innerHTML = `

            <div class="event-match-info">

                <strong>
                    ${escapeHtml(match.format)}
                </strong>

                <span>
                    ${escapeHtml(participantsDisplay)}
                </span>

                <span>
                    Thème :
                    ${escapeHtml(
                        match.theme ||
                        "Aucun thème"
                    )}
                </span>

                <span>
                    Date :
                    ${escapeHtml(date)}
                </span>

                <span>
                    Statut :
                    ${escapeHtml(statusLabel)}
                </span>

                ${
                    winnerName
                        ? `
                            <span>
                                🏆 Gagnant :
                                ${escapeHtml(winnerName)}
                            </span>
                        `
                        : ""
                }

                ${
                    match.cancel_reason
                        ? `
                            <span>
                                Motif :
                                ${escapeHtml(
                                    match.cancel_reason
                                )}
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="event-match-actions">

                <button
                    type="button"
                    class="edit-match-btn"
                    data-id="${match.id}"
                >
                    ✏️ Modifier
                </button>

                ${
                    match.status === "pending"
                        ? `
                            <button
                                type="button"
                                class="start-match-btn"
                                data-id="${match.id}"
                            >
                                ▶️ Démarrer
                            </button>
                        `
                        : ""
                }

                ${
                    match.status === "active"
                        ? `
                            <button
                                type="button"
                                class="finish-match-btn"
                                data-id="${match.id}"
                            >
                                🏆 Terminer
                            </button>
                        `
                        : ""
                }

                ${
                    match.status !== "finished" &&
                    match.status !== "cancelled"
                        ? `
                            <button
                                type="button"
                                class="cancel-match-btn"
                                data-id="${match.id}"
                            >
                                ❌ Annuler
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="delete-match-btn"
                    data-id="${match.id}"
                >
                    🗑️ Supprimer
                </button>

            </div>

        `;

        container.appendChild(
            item
        );
    }


    // ==============================================
    // BOUTON MODIFIER
    // ==============================================

    container
        .querySelectorAll(
            ".edit-match-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editEventMatch(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    // ==============================================
    // BOUTON DÉMARRER
    // ==============================================

    container
        .querySelectorAll(
            ".start-match-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        startEventMatch(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    // ==============================================
    // BOUTON TERMINER
    // ==============================================

    container
        .querySelectorAll(
            ".finish-match-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        finishEventMatch(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    // ==============================================
    // BOUTON ANNULER
    // ==============================================

    container
        .querySelectorAll(
            ".cancel-match-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        cancelEventMatch(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    // ==============================================
    // BOUTON SUPPRIMER
    // ==============================================

    container
        .querySelectorAll(
            ".delete-match-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteEventMatch(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );
}


// ==================================================
// AJOUTER UN PETIT DUEL
// ==================================================

async function addEventMatch() {

    if (!currentEvent) {

        alert(
            "Crée d'abord un événement."
        );

        return;
    }

    const format =
        document.getElementById(
            "match-format"
        ).value;

    const theme =
        document.getElementById(
            "match-theme"
        ).value.trim();

    const date =
        document.getElementById(
            "match-date"
        ).value;

    if (!format) {

        alert(
            "Sélectionne un format."
        );

        return;
    }

    if (!theme) {

        alert(
            "Le thème du duel est obligatoire."
        );

        return;
    }

    if (!date) {

        alert(
            "La date et l'heure sont obligatoires."
        );

        return;
    }

    const participantSelects =
        document.querySelectorAll(
            ".match-participant-select"
        );

    const selectedParticipants = [];

    participantSelects.forEach(
        select => {

            const memberId =
                Number(
                    select.value
                );

            const team =
                Number(
                    select.dataset.team
                );

            if (memberId) {

                selectedParticipants.push({

                    member_id:
                        memberId,

                    team:
                        team

                });
            }
        }
    );

    const expectedParticipants =
        matchFormats[format]
            .reduce(
                (
                    total,
                    size
                ) =>
                    total + size,
                0
            );

    if (
        selectedParticipants.length !==
        expectedParticipants
    ) {

        alert(
            "Sélectionne tous les participants du duel."
        );

        return;
    }

    const memberIds =
        selectedParticipants.map(
            participant =>
                participant.member_id
        );

    const uniqueIds =
        new Set(
            memberIds
        );

    if (
        uniqueIds.size !==
        memberIds.length
    ) {

        alert(
            "Un même participant ne peut pas apparaître plusieurs fois dans le même duel."
        );

        return;
    }

    const {
        data: match,
        error
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .insert({

                event_id:
                    currentEvent.id,

                format:
                    format,

                theme:
                    theme,

                scheduled_at:
                    date,

                status:
                    "pending"

            })
            .select()
            .single();

    if (error) {

        console.error(
            "Erreur création petit duel :",
            error
        );

        alert(
            "Impossible de créer le petit duel."
        );

        return;
    }

    const participantRows =
        selectedParticipants.map(
            participant => ({

                match_id:
                    match.id,

                member_id:
                    participant.member_id,

                team:
                    participant.team

            })
        );

    const {
        error: participantError
    } =
        await supabaseClient
            .from(
                "duel_event_match_participants"
            )
            .insert(
                participantRows
            );

    if (participantError) {

        console.error(
            "Erreur ajout participants :",
            participantError
        );

        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .delete()
            .eq(
                "id",
                match.id
            );

        alert(
            "Impossible d'enregistrer les participants du duel."
        );

        return;
    }

    resetMatchForm();

    await loadEventMatches();

    alert(
        "Petit duel ajouté."
    );
}


// ==================================================
// MODIFIER UN PETIT DUEL
// ==================================================

async function editEventMatch(
    matchId
) {

    const match =
        eventMatches.find(
            item =>
                Number(item.id) ===
                Number(matchId)
        );

    if (!match) {

        alert(
            "Petit duel introuvable."
        );

        return;
    }

    const newTheme =
        prompt(
            "Nouveau thème :",
            match.theme || ""
        );

    if (newTheme === null) return;

    const currentDate =
        match.scheduled_at
            ? new Date(
                match.scheduled_at
            )
                .toISOString()
                .slice(
                    0,
                    16
                )
            : "";

    const newDate =
        prompt(
            "Nouvelle date et heure au format YYYY-MM-DDTHH:MM :",
            currentDate
        );

    if (newDate === null) return;

    const {
        error
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .update({

                theme:
                    newTheme.trim() ||
                    null,

                scheduled_at:
                    newDate

            })
            .eq(
                "id",
                matchId
            );

    if (error) {

        console.error(
            "Erreur modification petit duel :",
            error
        );

        alert(
            "Impossible de modifier le petit duel."
        );

        return;
    }

    await loadEventMatches();

    alert(
        "Petit duel modifié."
    );
}


// ==================================================
// DÉMARRER UN PETIT DUEL
// ==================================================

async function startEventMatch(
    matchId
) {

    const confirmation =
        confirm(
            "Démarrer ce petit duel ?"
        );

    if (!confirmation) return;

    const {
        error
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .update({

                status:
                    "active"

            })
            .eq(
                "id",
                matchId
            );

    if (error) {

        console.error(
            "Erreur démarrage petit duel :",
            error
        );

        alert(
            "Impossible de démarrer le petit duel."
        );

        return;
    }

    await loadEventMatches();
}


// ==================================================
// TERMINER UN PETIT DUEL
// ==================================================

async function finishEventMatch(
    matchId
) {

    const {
        data: participants,
        error
    } =
        await supabaseClient
            .from(
                "duel_event_match_participants"
            )
            .select(`
                member_id,
                team,
                members (
                    username
                )
            `)
            .eq(
                "match_id",
                matchId
            );

    if (error) {

        console.error(
            "Erreur chargement participants :",
            error
        );

        alert(
            "Impossible de charger les participants."
        );

        return;
    }

    if (
        !participants ||
        participants.length === 0
    ) {

        alert(
            "Ce petit duel n'a aucun participant."
        );

        return;
    }

    const winnersText =
        participants
            .map(
                participant =>
                    `${participant.member_id} - ${participant.members?.username || "Inconnu"}`
            )
            .join("\n");

    const winnerId =
        prompt(
            `Entre l'ID du gagnant :\n\n${winnersText}`
        );

    if (winnerId === null) return;

    const winner =
        participants.find(
            participant =>
                Number(
                    participant.member_id
                ) ===
                Number(winnerId)
        );

    if (!winner) {

        alert(
            "L'ID indiqué ne correspond pas à un participant de ce duel."
        );

        return;
    }

    const {
        error: updateError
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .update({

                status:
                    "finished",

                winner_id:
                    winner.member_id

            })
            .eq(
                "id",
                matchId
            );

    if (updateError) {

        console.error(
            "Erreur fin petit duel :",
            updateError
        );

        alert(
            "Impossible de terminer le petit duel."
        );

        return;
    }

    await loadEventMatches();

    alert(
        `Petit duel terminé. Gagnant : ${winner.members?.username || "Inconnu"}`
    );
}


// ==================================================
// ANNULER UN PETIT DUEL
// ==================================================

async function cancelEventMatch(
    matchId
) {

    const reason =
        prompt(
            "Pourquoi ce petit duel est-il annulé ?"
        );

    if (reason === null) return;

    if (!reason.trim()) {

        alert(
            "Un motif d'annulation est obligatoire."
        );

        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .update({

                status:
                    "cancelled",

                cancel_reason:
                    reason.trim(),

                winner_id:
                    null

            })
            .eq(
                "id",
                matchId
            );

    if (error) {

        console.error(
            "Erreur annulation petit duel :",
            error
        );

        alert(
            "Impossible d'annuler le petit duel."
        );

        return;
    }

    await loadEventMatches();

    alert(
        "Petit duel annulé."
    );
}


// ==================================================
// SUPPRIMER DÉFINITIVEMENT UN PETIT DUEL
// ==================================================

async function deleteEventMatch(
    matchId
) {

    const confirmation =
        confirm(
            "Supprimer définitivement ce petit duel ?\n\nCette action sert uniquement à corriger une erreur de saisie."
        );

    if (!confirmation) return;

    const {
        error
    } =
        await supabaseClient
            .from(
                "duel_event_matches"
            )
            .delete()
            .eq(
                "id",
                matchId
            );

    if (error) {

        console.error(
            "Erreur suppression petit duel :",
            error
        );

        alert(
            "Impossible de supprimer le petit duel."
        );

        return;
    }

    await loadEventMatches();

    alert(
        "Petit duel supprimé."
    );
}


// ==================================================
// NETTOYER LE FORMULAIRE PETIT DUEL
// ==================================================

function resetMatchForm() {

    const format =
        document.getElementById(
            "match-format"
        );

    const theme =
        document.getElementById(
            "match-theme"
        );

    const date =
        document.getElementById(
            "match-date"
        );

    const participants =
        document.getElementById(
            "match-participants-container"
        );

    if (format) {

        format.value = "";

    }

    if (theme) {

        theme.value = "";

    }

    if (date) {

        date.value = "";

    }

    if (participants) {

        participants.innerHTML = `
            <p>
                Sélectionne d'abord un format.
            </p>
        `;

    }
}


// ==================================================
// UTILITAIRE : PROTÉGER L'AFFICHAGE HTML
// ==================================================

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ==================================================
// ÉVÉNEMENTS DES BOUTONS
// ==================================================

document
    .getElementById(
        "save-event-btn"
    )
    ?.addEventListener(
        "click",
        saveEvent
    );


document
    .getElementById(
        "event-status-select"
    )
    ?.addEventListener(
        "change",
        updateStatus
    );


document
    .getElementById(
        "add-participant-btn"
    )
    ?.addEventListener(
        "click",
        addEventParticipant
    );


document
    .getElementById(
        "add-match-btn"
    )
    ?.addEventListener(
        "click",
        addEventMatch
    );


// ==================================================
// INITIALISATION
// ==================================================

async function initializeDuelAdmin() {

    await loadEvent();

    await loadMembersForParticipantSelect();

    await loadEventParticipants();

}


initializeDuelAdmin();
