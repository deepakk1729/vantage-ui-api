import { Page } from '@playwright/test';

// import { LocationFilter } from './LocationFilter';
import { MonthsFilter } from './MonthsFilter';
// import { PracticeAreaFilter } from './PracticeAreaFilter';

export class FiltersPanel {

  readonly months: MonthsFilter;

  //readonly practiceArea: PracticeAreaFilter;

//   readonly location: LocationFilter;

  constructor(page: Page) {

    this.months = new MonthsFilter(page);

    // this.practiceArea =
    //   new PracticeAreaFilter(page);

    // this.location =
    //   new LocationFilter(page);
  }
}