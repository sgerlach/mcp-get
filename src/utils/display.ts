import chalk from 'chalk';
import stringWidth from 'string-width';
import { Package } from '../types';

export function padString(str: string, width: number): string {
  const length = stringWidth(str);
  return str + ' '.repeat(Math.max(0, width - length));
}

export function displayPackageDetails(pkg: Package) {
  const boxWidth = 80;
  const padding = 2;
  const labelWidth = 13;
  const horizontalLine = '─'.repeat(boxWidth - 2);

  const contentWidth = boxWidth - 2;

  console.log(chalk.gray('┌' + horizontalLine + '┐'));

  // Title line with package name
  const titleContent = ' '.repeat(padding) + pkg.name;
  const titlePadded = padString(titleContent, contentWidth);
  console.log(chalk.gray('│') + chalk.bold.green(titlePadded) + chalk.gray('│'));

  console.log(chalk.gray('├' + horizontalLine + '┤'));

  const lines = [
    ['Description', pkg.description],
    ['Vendor', pkg.vendor],
    ['License', pkg.license],
    ['Homepage', pkg.homepage],
    ['Source', pkg.sourceUrl],
  ];

  lines.forEach(([label, value]) => {
    if (value) { // Only display if value exists
      const labelStr = chalk.yellow(`${label}:`.padEnd(labelWidth));
      const lineStart = ' '.repeat(padding) + labelStr;
      const content = lineStart + value;
      const paddedContent = padString(content, contentWidth);
      console.log(chalk.gray('│') + paddedContent + chalk.gray('│'));
    }
  });

  console.log(chalk.gray('└' + horizontalLine + '┘'));
  console.log(''); // Add spacing between packages
} 