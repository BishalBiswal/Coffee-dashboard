from django.core.management.base import BaseCommand
from apps.core_app.models import Crop, Season
from datetime import date


class Command(BaseCommand):
    help = 'Auto-create seasons for all crops for upcoming year'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=int,
            help='Specific year to create seasons for (defaults to current + 1)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without creating',
        )

    def handle(self, *args, **options):
        target_year = options.get('year')
        dry_run = options.get('dry_run', False)
        
        if target_year is None:
            target_year = date.today().year + 1
        
        crops = Crop.objects.all()
        
        seasons_data = [
            ('Summer ' + str(target_year), target_year, 3, 1, target_year, 5, 31),
            ('Monsoon ' + str(target_year), target_year, 6, 1, target_year, 9, 30),
            ('Winter ' + str(target_year), target_year, 10, 1, target_year + 1, 2, 28),
        ]
        
        total_created = 0
        
        for crop in crops:
            for name, start_year, start_month, start_day, end_year, end_month, end_day in seasons_data:
                start_date = date(start_year, start_month, start_day)
                end_date = date(end_year, end_month, end_day)
                
                exists = Season.objects.filter(
                    crop=crop,
                    name=name,
                    start_date=start_date,
                    end_date=end_date
                ).exists()
                
                if exists:
                    self.stdout.write(f'Skipping (exists): {crop.name} - {name}')
                    continue
                
                if dry_run:
                    self.stdout.write(f'Would create: {crop.name} - {name}')
                    total_created += 1
                else:
                    Season.objects.create(
                        crop=crop,
                        name=name,
                        start_date=start_date,
                        end_date=end_date,
                        is_active=True,
                        description=f'Auto-generated season for {target_year}'
                    )
                    self.stdout.write(f'Created: {crop.name} - {name}')
                    total_created += 1
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'\nWould create {total_created} seasons for {target_year}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\nCreated {total_created} seasons for {target_year}'))