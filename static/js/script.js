async function imageUpload(input) {
    const file = input.files[0];
    const fileSize = file.size;
    const fileKb = fileSize / 1024;
    let fileResult = document.getElementById("file-result");
    let submitButton = document.querySelector('#book-submit-btn');
    if (fileKb < 70) {
        submitButton.disabled = false;
        const base64 = await convertToBase64(file);
        console.log(base64)
        try {
            document.getElementById("image-upload-text").value = base64;
        } catch (e) {
            console.log(e)
        }
    } else {
        fileResult.innerHTML = "Please select a file less than 70KB";
        submitButton.disabled = true;
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
            resolve(fileReader.result)
        };
        fileReader.onerror = (error) => {
            reject(error)
        };
    })
}

function sortobj(attr, asc) {
    booksList = document.getElementById("books-list");
    bookCols = booksList.children;
    if (attr == "name")
        bookCols = Array.from(bookCols).sort((a, b) => a.children[0].children[1].querySelector(".card-title").textContent.toLowerCase() < b.children[0].children[1].querySelector(".card-title").textContent.toLowerCase() ? -asc : asc);
    else if (attr == "price")
        bookCols = Array.from(bookCols).sort((a, b) => a.children[0].children[1].querySelector(".book-list-price").textContent.toLowerCase() < b.children[0].children[1].querySelector(".book-list-price").textContent.toLowerCase() ? -asc : asc);
    else if (attr == "edition")
        bookCols = Array.from(bookCols).sort((a, b) => a.children[0].children[1].querySelector(".book-list-edition").textContent.toLowerCase() < b.children[0].children[1].querySelector(".book-list-edition").textContent.toLowerCase() ? -asc : asc);
    else if (attr == "date")
        bookCols = Array.from(bookCols).sort((a, b) => a.children[0].children[1].querySelector(".book-list-date").textContent.toLowerCase() < b.children[0].children[1].querySelector(".book-list-date").textContent.toLowerCase() ? -asc : asc);
    booksList.replaceChildren(...bookCols);
}

// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()