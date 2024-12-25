import '@material/web/textfield/outlined-text-field.js'
import '@material/web/button/filled-button.js'

document.querySelector('#button-query')?.addEventListener('click', () => {
    const textFieldCytoidId = document.querySelector('#text-field-cytoid-id');
    if (textFieldCytoidId) {
        const cytoidId = textFieldCytoidId.value;
        fetch(`https://services.cytoid.io/profile/${cytoidId}/details`, {
            headers: {
                "User-Agent": "CytoidClient/2.1.1"
            }
        }).then(async (response: Response) => {
            if (response.ok) {
                return response.text();
            }
        }).then(json => {
            const display = document.querySelector('#display');
            if (display && json) {
                display.textContent = json;
            }
        })
    }
})
