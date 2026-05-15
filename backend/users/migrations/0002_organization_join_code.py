import secrets
import string

from django.db import migrations, models


def assign_join_codes(apps, schema_editor):
    Organization = apps.get_model("users", "Organization")
    alphabet = string.ascii_uppercase + string.digits

    existing_codes = set(
        Organization.objects.exclude(join_code="").values_list("join_code", flat=True)
    )

    for organization in Organization.objects.all():
        if organization.join_code:
            continue

        join_code = "".join(secrets.choice(alphabet) for _ in range(8))
        while join_code in existing_codes:
            join_code = "".join(secrets.choice(alphabet) for _ in range(8))

        organization.join_code = join_code
        organization.save(update_fields=["join_code"])
        existing_codes.add(join_code)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="join_code",
            field=models.CharField(default="", editable=False, max_length=12, unique=True),
            preserve_default=False,
        ),
        migrations.RunPython(assign_join_codes, migrations.RunPython.noop),
    ]
