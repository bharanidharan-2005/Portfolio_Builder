from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True, required=False)

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def validate(self, data):
        confirm = data.get('confirm_password')
        if confirm is not None and confirm != '' and confirm != data.get('password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, allow_blank=True)
    code = serializers.CharField(required=False, write_only=True, allow_blank=True)

    def validate(self, data):
        identifier = (data.get('email') or data.get('username') or '').strip()
        password = data.get('password', '')
        code = data.get('code', '').strip()

        if not (code or (identifier and password)):
            raise serializers.ValidationError(
                "Please provide either your Email and Password or a Workspace Access Code."
            )
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    reset_code = serializers.CharField(required=False, write_only=True, allow_blank=True)
    current_password = serializers.CharField(required=False, write_only=True, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True, required=False)
    new_password = serializers.CharField(min_length=8, write_only=True, required=False)

    def validate(self, data):
        new_pw = data.get('new_password') or data.get('password') or ''
        if len(new_pw) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        try:
            validate_password(new_pw)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        data['resolved_password'] = new_pw
        return data


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True, required=False)
    avatar = serializers.CharField(max_length=16, required=False, allow_blank=True)
