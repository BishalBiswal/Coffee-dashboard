from django.core.management.base import BaseCommand
from apps.core_app.models import Crop, Season, DailyWorkLog
from datetime import date, timedelta
import calendar


class Command(BaseCommand):
    help = 'Auto-categorize logs into seasons based on date ranges and create future seasons'

    def add_arguments(self, parser):
        parser.add_argument(
            '--future-years',
            type=int,
            default=2,
            help='Number of future years to create seasons for',
        )

    def handle(self, *args, **options):
        future_years = options.get('future-years', 2)
        current_year = date.today().year
        
        crops = Crop.objects.all()
        
        for crop in crops:
            self.stdout.write(f'Processing {crop.name}...')
            
            crop_logs = DailyWorkLog.objects.filter(crop=crop).order_by('log_date')
            if crop_logs.exists():
                min_date = crop_logs.first().log_date
                max_date = crop_logs.last().log_date
                
                start_year = min_date.year
                end_year = max_date.year
                
                for year in range(start_year, end_year + 1):
                    self._create_season_for_year(crop, year)
            
            for year in range(current_year, current_year + future_years + 1):
                self._create_season_for_year(crop, year)
        
        total_seasons = Season.objects.count()
        self.stdout.write(self.style.SUCCESS(f'\nTotal seasons: {total_seasons}'))
        
        unassigned = DailyWorkLog.objects.filter(season__isnull=True).count()
        if unassigned > 0:
            self.stdout.write(self.style.WARNING(f'Unassigned logs: {unassigned}'))
        else:
            self.stdout.write(self.style.SUCCESS('All logs assigned to seasons'))

    def _create_season_for_year(self, crop, year):
        monsoon_start = date(year, 6, 1)
        monsoon_end = date(year, 9, 30)
        winter_start = date(year, 10, 1)
        winter_end = date(year + 1, 2, 28) if year < 9999 else date(year, 12, 31)
        summer_start = date(year, 3, 1)
        summer_end = date(year, 5, 31)
        
        seasons_data = [
            ('Monsoon ' + str(year), monsoon_start, monsoon_end),
            ('Winter ' + str(year), winter_start, winter_end),
            ('Summer ' + str(year), summer_start, summer_end),
        ]
        
        for name, s_date, e_date in seasons_data:
            existing = Season.objects.filter(crop=crop, name=name, start_date=s_date, end_date=e_date).first()
            if existing:
                logs_in_range = DailyWorkLog.objects.filter(
                    crop=crop,
                    log_date__gte=s_date,
                    log_date__lte=e_date,
                    season__isnull=True
                )
                count = logs_in_range.count()
                if count > 0:
                    logs_in_range.update(season=existing)
                    self.stdout.write(f'  Assigned {count} logs to {name}')
            else:
                try:
                    season = Season.objects.create(
                        crop=crop,
                        name=name,
                        start_date=s_date,
                        end_date=e_date,
                        is_active=True,
                        description=f'Auto-generated season for {crop.name}'
                    )
                    self.stdout.write(f'  Created season: {name}')
                    
                    logs_in_range = DailyWorkLog.objects.filter(
                        crop=crop,
                        log_date__gte=s_date,
                        log_date__lte=e_date,
                        season__isnull=True
                    )
                    count = logs_in_range.count()
                    if count > 0:
                        logs_in_range.update(season=season)
                        self.stdout.write(f'  Assigned {count} logs to {name}')
                except Exception as e:
                    self.stdout.write(f'  Skipped {name}: {e}')