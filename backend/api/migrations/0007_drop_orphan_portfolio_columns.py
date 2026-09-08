# Reconciles a local SQLite DB that was created from an older schema still
# containing the removed `subdomain` and `user_id` columns on api_portfolio.
# Those columns are not present in the current models/migrations and cause
# every Portfolio insert to fail with a NOT NULL IntegrityError (HTTP 500).

from django.db import migrations


def drop_orphan_portfolio_columns(apps, schema_editor):
    # Only act on SQLite (the local dev DB). Postgres/prod is built from the
    # migrations that never had these columns, so nothing to do there.
    if schema_editor.connection.vendor != 'sqlite':
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(api_portfolio)")
        existing = {row[1] for row in cursor.fetchall()}
        for col in ('subdomain', 'user_id'):
            if col in existing:
                cursor.execute("ALTER TABLE api_portfolio DROP COLUMN %s" % col)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_otpverification_expires_at'),
    ]

    operations = [
        migrations.RunPython(drop_orphan_portfolio_columns, reverse_noop),
    ]
