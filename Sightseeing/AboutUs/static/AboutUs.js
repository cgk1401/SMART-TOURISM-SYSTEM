// Mapping of photo IDs to member names
const memberPhotoMap = {
    'photo-cuong': 'cuong',
    'photo-kien': 'kien',
    'photo-khoa': 'khoa',
    'photo-trung': 'trung',
    'photo-triet': 'triet',
    'photo-duy': 'duy',
    'photo-huu': 'huu'
};

async function updateMemberPhoto(event, targetId) {
    const file = event.target.files[0];
    if (!file) return;

    // Get member name from mapping
    const memberName = memberPhotoMap[targetId];
    if (!memberName) {
        console.error('Unknown member photo ID:', targetId);
        return;
    }

    // Show preview immediately (local preview)
    const previewURL = URL.createObjectURL(file);
    document.getElementById(targetId).src = previewURL;

    try {
        // Create FormData to send file to server
        const formData = new FormData();
        formData.append('file', file);
        formData.append('member_name', memberName);

        // Get CSRF token from cookie or meta tag
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }

        const csrftoken = getCookie('csrftoken');

        // Send to backend
        const response = await axios.post('/about/upload_team_photo/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-CSRFToken': csrftoken || ''
            }
        });

        if (response.data.success) {
            // Add cache-busting parameter (timestamp) to force browser to reload the image
            const timestamp = new Date().getTime();
            const imageUrlWithCache = `${response.data.file_url}?t=${timestamp}`;
            document.getElementById(targetId).src = imageUrlWithCache;
            console.log('Photo updated successfully:', memberName);
        } else {
            console.error('Upload failed:', response.data.message);
            alert('Failed to upload photo: ' + response.data.message);
        }
    } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Error uploading photo. Please try again.');
    }
}