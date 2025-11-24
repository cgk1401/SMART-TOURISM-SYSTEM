function updateMemberPhoto(event, targetId) {
    const file = event.target.files[0];
    if (!file) return;

    const newURL = URL.createObjectURL(file);
    document.getElementById(targetId).src = newURL;
}