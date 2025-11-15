from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
import os

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
    

    # Regex chỉ cho phép các chữ số 0-9 và dấu cộng (+)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', # Ví dụ: cho phép + và 9-15 chữ số
        message="Số điện thoại phải ở định dạng: '+999999999'. Tối đa 15 chữ số."
    )
    
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=15, 
        blank=True, 
        null=True,
        unique=True 
    )
    
    # Ghi đè phương thức save()
    def save(self, *args, **kwargs):
        # 1. Kiểm tra xem đối tượng (instance) này đã tồn tại trong DB chưa
        # (nghĩa là đang cập nhật, không phải tạo mới)
        try:
            old_profile = Profile.objects.get(pk=self.pk)
        except Profile.DoesNotExist:
            # Nếu là đối tượng mới, không cần làm gì thêm
            super().save(*args, **kwargs)
            return

        # 2. Nếu đối tượng đã tồn tại, kiểm tra xem avatar có thay đổi không
        if old_profile.avatar and old_profile.avatar != self.avatar:
            # 3. Nếu avatar thay đổi, xóa file avatar cũ
            # Kiểm tra file vật lý có tồn tại trước khi xóa
            if os.path.isfile(old_profile.avatar.path):
                os.remove(old_profile.avatar.path)

        # 4. Lưu đối tượng Profile mới
        super().save(*args, **kwargs)