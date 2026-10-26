from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True, required=False)

    def validate(self, data):
        confirm = data.get('confirm_password')
        if confirm and confirm != data.get('password'):
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
            raise serializers.ValidationError("Please provide either your Email and Password or a Workspace Access Code.")
        return data