from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
from pathlib import Path

def function_AboutUs(request):
    return render(request, 'app/AboutUs.html')


@csrf_exempt
@require_http_methods(["POST"])
def upload_team_photo(request):
    """
    Handle team member photo upload.
    Expected POST parameters:
    - file: image file (jpg, jpeg, png, gif, webp, etc.)
    - member_name: name of the team member (used as filename)
    
    Saves to media/aboutUsCard/{member_name}.{extension}
    Deletes old photo if it exists.
    """
    try:
        if 'file' not in request.FILES:
            return JsonResponse({'success': False, 'message': 'No file provided'}, status=400)
        
        if 'member_name' not in request.POST:
            return JsonResponse({'success': False, 'message': 'No member name provided'}, status=400)
        
        file = request.FILES['file']
        member_name = request.POST.get('member_name', '').strip()
        
        if not member_name:
            return JsonResponse({'success': False, 'message': 'Invalid member name'}, status=400)
        
        # Get file extension (preserve original format)
        file_ext = os.path.splitext(file.name)[1].lower()
        
        # Allowed image formats
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'}
        
        if not file_ext or file_ext not in allowed_extensions:
            return JsonResponse({
                'success': False, 
                'message': f'Invalid file format. Allowed: {", ".join(allowed_extensions)}'
            }, status=400)
        
        # Normalize .jpeg to .jpg for consistency
        if file_ext == '.jpeg':
            file_ext = '.jpg'
        
        # Create media/aboutUsCard directory if it doesn't exist
        # Save to Sightseeing/media/aboutUsCard/ folder
        sightseeing_dir = Path(__file__).resolve().parent.parent
        media_dir = sightseeing_dir / 'media' / 'aboutUsCard'
        media_dir.mkdir(parents=True, exist_ok=True)
        print(f"Member: {member_name}, Extension: {file_ext}")
        
        # Delete old photos with this member name (any extension)
        for existing_file in media_dir.glob(f"{member_name}.*"):
            try:
                existing_file.unlink()
            except Exception as e:
                print(f"Error deleting old file {existing_file}: {e}")
        
        # Save new photo with desired name and extension
        new_filename = f"{member_name}{file_ext}"
        file_path = media_dir / new_filename
        
        with open(file_path, 'wb') as f:
            for chunk in file.chunks():
                f.write(chunk)
        
        # Verify file was saved
        if not file_path.exists():
            return JsonResponse({
                'success': False,
                'message': 'File was not saved successfully'
            }, status=500)
        
        # Return the URL to the saved file
        media_url = f"/media/aboutUsCard/{new_filename}"
        
        return JsonResponse({
            'success': True,
            'message': 'Photo uploaded successfully',
            'file_url': media_url
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Error uploading file: {str(e)}'
        }, status=500)