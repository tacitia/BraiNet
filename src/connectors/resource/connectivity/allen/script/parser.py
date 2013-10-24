from bs4 import BeautifulSoup

inputfilename = '../data/query.xml'
inputfile = open(inputfilename)
soup = BeautifulSoup(inputfile)

specimens = soup.find_all('specimen')
injections = soup.find_all('injection')

print len(specimens)
print len(injections)