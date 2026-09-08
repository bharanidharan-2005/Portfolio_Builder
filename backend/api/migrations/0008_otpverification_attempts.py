from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_drop_orphan_portfolio_columns'),
    ]

    operations = [
        migrations.AddField(
            model_name='otpverification',
            name='attempts',
            field=models.IntegerField(default=0),
        ),
    ]
