import 'mdui/mdui.css';
import 'mdui';
import {alert} from 'mdui/functions/alert';
import {snackbar} from 'mdui/functions/snackbar';
import {Button, ButtonIcon, NavigationDrawer, TextField} from "mdui";

const navigationDrawer = document.querySelector(".navigation-drawer") as NavigationDrawer
const buttonOpenDrawer = document.querySelector(".open-drawer") as ButtonIcon
const inputCytoidID = document.querySelector("#input-cytoid-id") as TextField
const buttonCCB = document.querySelector("#button-ccb") as Button

buttonOpenDrawer.addEventListener('click', function () {
    navigationDrawer.open = true
})

buttonCCB.addEventListener('click', function () {
    inputCytoidID.helper = undefined
    const cytoidId = inputCytoidID.value
    if (!checkCytoidId(cytoidId)) {
        alert({
            headline: "Cytoid ID格式错误",
            description: "请检查你的输入",
            confirmText: "OK"
        })
    } else {
        buttonCCB.loading = true
        buttonCCB.disabled = true

        const payload = {
            query: `{
                profile(uid:"${cytoidId}"){
                    user{
                        uid
                    }
                    bestRecords(limit:30){
                        ...UserRecord
                    }
                }
            }

            fragment UserRecord on UserRecord {
                score
                accuracy
                mods
                details {
                    perfect
                    great
                    good
                    bad
                    miss
                    maxCombo
                }
                rating
                date
                chart {
                    difficulty
                    type
                    name
                    notesCount
                    level {
                        uid
                        title
                        bundle {
                            backgroundImage {
                                thumbnail
                                original
                            }
                            music
                            musicPreview
                        }
                    }
                }
            }`
        }
        fetch(`https://services.cytoid.io/graphql`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "CytoidClient/2.1.1" // 在Chromium上不工作：https://bugs.chromium.org/p/chromium/issues/detail?id=571722
            }
        }).then(response => {
            if (response.ok) {
                return response.json() as Promise<ProfileDetailsResponse>;
            } else {
                snackbar({
                    message: `Fetch failed: ${response.status}`
                })
                buttonCCB.loading = false
                buttonCCB.disabled = false
            }
        }).then((json) => {
            const resultsContainer = document.querySelector('.result-container')
            if (resultsContainer && json?.data?.profile) {
                let html = '';
                for (let i = 0; i < json.data.profile.bestRecords.length; i++) {
                    const record = json.data.profile.bestRecords[i];
                    const date = new Date(record.date)
                    const formated_date = date.toLocaleString()

                    html += `
                        <mdui-card class="result-card">
                            <img src="${record.chart.level.bundle.backgroundImage.thumbnail}" alt="${record.chart.level.title}" class="result-card-cover">
                            <div class="result-card-text">
                                <span class="result-card-order">#${i + 1}.</span>
                                <span class="result-card-title">${record.chart.level.title}</span>
                                <span class="result-card-uid">${record.chart.level.uid}</span>
                                <span class="result-card-difficulty-${record.chart.type}">${record.chart.name ? record.chart.name : record.chart.type} ${record.chart.difficulty}</span>
                                <span class="result-card-score">${record.score}</span>
                                <span class="result-card-mods">`
                    for (const mod of record.mods) {
                        html += `<img class="result-card-mod" src="/Cytoid-Info-Querier-Web/public/mod_${mod}.png" alt="${mod}">`
                    }
                    html += `</span>
                                <span class="result-card-accuracy">${record.accuracy * 100}% | ${record.details.maxCombo} max combo</span>
                                <span class="result-card-rating">Rating ${record.rating}</span>
                                <div class="result-card-details">
                                    <div>Perfect <span class="result-card-detail-perfect">${record.details.perfect}</span></div>
                                    <div>Great <span class="result-card-detail-great">${record.details.great}</span></div>
                                    <div>Good <span class="result-card-detail-good">${record.details.good}</span></div>
                                    <div>Bad <span class="result-card-detail-bad">${record.details.bad}</span></div>
                                    <div>Miss <span class="result-card-detail-miss">${record.details.miss}</span></div>
                                </div>
                                <span class="result-card-date">${formated_date}</span>
                            </div>
                        </mdui-card>
                    `;
                }
                resultsContainer.innerHTML = html;
            } else {
                snackbar({
                    message: 'Parse failed'
                })
                buttonCCB.loading = false
                buttonCCB.disabled = false
            }
            buttonCCB.loading = false
            buttonCCB.disabled = false
        })
    }
})

function checkCytoidId(cytoidId: string): boolean {
    if (cytoidId.length < 3 || cytoidId.length > 16) return false;
    return RegExp("^[a-z0-9_-]*$").test(cytoidId)
}

interface ProfileDetailsResponse {
    data: {
        profile: {
            user: {
                uid: string
            }
            bestRecords: {
                score: number
                accuracy: number
                mods: string[]
                details: {
                    perfect: number
                    great: number
                    good: number
                    bad: number
                    miss: number
                    maxCombo: number
                }
                rating: number
                date: string
                chart: {
                    difficulty: number
                    type: string
                    name: string | null
                    notesCount: number
                    level: {
                        uid: string
                        title: string
                        bundle: {
                            backgroundImage: {
                                thumbnail: string
                                original: string
                            }
                            music: string
                            musicPreview: string
                        }
                    }
                }
            }[]
        } | null
    }
}
