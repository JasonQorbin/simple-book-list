//Because editing a book is a multistage process, these two keep track of when we are editing and which book.
//These obviously reset when the page refreshed which gives the user a way to exit editing mode is they change their mind.
let isEditing = false;
let indexBeingEdited = -1;

/*Saving queries to elements access multiple times for readability.*/
const element_FieldSetLegend = document.querySelector("fieldset legend");
const element_FieldSetButton = document.querySelector("fieldset button");
const element_formFieldTitle = document.querySelector("#field-title");
const element_formFieldAuthor = document.querySelector("#field-author");
const element_formFieldGenre = document.querySelector("#field-genre");
const element_formFieldDate = document.querySelector("#field-date");
const element_formFieldDone = document.querySelector("#field-done");

function switchToEditing(){
    if (isEditing) {
        return;
    }
    element_FieldSetLegend.textContent = "Edit existing book";
    element_FieldSetButton.textContent = "Change";
    element_FieldSetButton.removeEventListener("click", addBook);
    element_FieldSetButton.addEventListener("click", finishEditingBook);

    isEditing = true;
}

/**
 * Constructor function to create books
 */
function createBook (
    title,
    author,
    genre,
    date,
    done
) {
    this.title = title;
    this.author = author;
    this.genre = genre;
    this.date = date;
    this.done = done;

}

/**
 * Fetch the stored array of books from sessionStorage.
 */
function getStoredBooks(){
    let storedData = sessionStorage.getItem("books");
    if (storedData === null) {      //First check is there is any data stored (i.e. the page has run before)
        sessionStorage.setItem("books", JSON.stringify([])); //If nothing is there then initialize with an empty array and load again.
        storedData = sessionStorage.getItem("books");
    }

    return JSON.parse(storedData);
}

/**Stores the current books array in session Storage. Call this after modifying the array.
 * I use a function for this to minimize the chances of me introducing a bug by typing the wrong key etc.
 */
function storeBooks() {
    sessionStorage.setItem("books", JSON.stringify(books));
}



/**
 * Prints the grid of book objects.
 */
function printBooks(){
    let bookGrid = document.querySelector("#book-grid");
    //console.log(books);
    for (let i = 0; i < books.length; i++) {
        books[i].print = function() {
            const innerString = `
                <div class="block">
                    <div class="button-div"><span class="edit-button">✏️</span><span class="delete-button">❌</span></div>
                    <p><span class="item-label">Title:</span><span class="item-text"> ${this.title}</span></p>
                    <p><span class="item-label">Author:</span><span class="item-text"> ${this.author}</span></p>
                    <p><span class="item-label">Genre:</span><span class="item-text"> ${this.genre}</span></p>
                    <p><span class="item-label">Published:</span><span class="item-text"> ${this.date}</span></p>
                    <p><span class="item-label">Done reading:</span><span class="item-text"> ${this.done ? "✅" : ""}</span></p>
                </div>
                `;
            const element = document.createElement("article");
            element.innerHTML =  innerString;
            element.setAttribute("index", i);

            //Add event listener for the delete button
            element.querySelector(".button-div .delete-button").addEventListener("click",deleteBook);

            //Add event listener for the edit button
            element.querySelector(".button-div .edit-button").addEventListener("click",startEditingBook);
            return element;
        };

        bookGrid.appendChild(books[i].print());
    }
}

/**
 * To be called after modifying the list to reflect the change. The only time this is really necessary is after deleting
 * a book because the page doesn't refresh for that action because the delete button is not a button inside a form.
 */
function rePrintBooks() {
    const bookGrid = document.querySelector("#book-grid");
    let child = bookGrid.lastChild;
    while (child) {
        bookGrid.removeChild(child);
        child = bookGrid.lastChild;
    }
    printBooks()
}


/**
 * Callback function for the "Add" button.
 *
 * Reads the information in the form fields and constructs a new book object, adds it to the books array and prints
 * the books out in the grid.
 */
function addBook() {
    console.log("clicked");
    let newBook = new createBook(
        element_formFieldTitle.value,
        element_formFieldAuthor.value,
        element_formFieldGenre.value,
        element_formFieldDate.value,
        element_formFieldDone.checked,
        );
    //console.log(newBook);
    //alert ("Wait");
    books.push(newBook);
    //console.log(books);
    sessionStorage.setItem("books", JSON.stringify(books));
    printBooks();
    //I don't need to call rePrintBooks here because the browser treats the button in the form as a submit input because I
    // didn't explicitly create one, and refreshes the page when it is clicked.
}

/**
 * The callback function when clicking an "edit" button.
 *
 * Puts the page in editing mode:
 * 1. Copies the existing book's information to the input fields.
 * 2. Finds and records the index of the book being edited.
 * 3. Call the function to change the page to reflect the change to editing mode.
 *
 * @param event The click event object. Used to find the parent <article> tag to fetch the index of the book to edit.
 */
function startEditingBook(event) {
    const index = parseInt(event.target.parentElement.parentElement.parentElement.getAttribute("index"));
    console.log(books);
    console.log(`index: ${index}`);
    let bookToEdit = books[index];
    element_formFieldTitle.value = bookToEdit.title;
    element_formFieldAuthor.value = bookToEdit.author;
    element_formFieldGenre.value = bookToEdit.genre;
    element_formFieldDate.value = bookToEdit.date;
    element_formFieldDone.checked = bookToEdit.done;

    indexBeingEdited = index;

    switchToEditing();
}

/**
 * Callback function for the "change" button. Called when the user is done editing the fields and wants to commit the changes.
 *
 * 1. Overwrites the existing book object with the data from the input fields.
 * 2. Stores that new data in sessionStorage.
 *
 * Note: We don't need to re-print the grid or switch back to "Adding mode" back the browser will refresh the page (and
 * this script) when the button is clicked and the state of the script variables will be reset that way.
 */
function finishEditingBook() {
    books[indexBeingEdited].title = element_formFieldTitle.value;
    books[indexBeingEdited].author = element_formFieldAuthor.value;
    books[indexBeingEdited].genre = element_formFieldGenre.value;
    books[indexBeingEdited].date= element_formFieldDate.value;
    books[indexBeingEdited].done = element_formFieldDone.checked;

    storeBooks();
}

/**
 * Deletes a book from the list and redraws the list.
 *
 * @param index The index of the book to be deleted
 */
function deleteBook(event) {
    //The index is an attribute on the article tag 3 levels up.
    index = parseInt(event.target.parentElement.parentElement.parentElement.getAttribute("index"));
    const response = confirm(`Are you sure you want to delete the book "${books[index].title}" by ${books[index].author}?`)
    if (response) {
        books.splice(index, 1);
        storeBooks();
        rePrintBooks();
    }
}

/**
 * Helper function. Resets all the values in the input form to nothing
 */
function clearFields () {
    element_formFieldTitle.value = "";
    element_formFieldAuthor.value = "";
    element_formFieldGenre.value = "";
    element_formFieldDate.value = "";
    element_formFieldDone.checked = false;
};

let books = getStoredBooks();
document.querySelector("#submit-button").addEventListener("click", addBook);
printBooks();

clearFields(); //reset the input fields if the user refreshed the screen while busy editing a book.
